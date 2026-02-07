class PostsController < ApplicationController
  before_action :authenticate_user!

  def new
    @post = current_user.posts.build
    @story = current_user.stories.build
  end

  def show
    @post = Post.includes(:user, comments: :user, media_attachments: :blob).find(params[:id])
    @share_friends = current_user.friends.includes(avatar_attachment: :blob).order(:username)
    @share_groups = current_user.groups.includes(avatar_attachment: :blob).order(:name)
    @close_path = close_path_from_referer
  end

  def create
    @post = current_user.posts.build(post_params)
    if @post.save
      mentioned = MentionParser.extract_usernames(@post.caption)
      if mentioned.any?
        User.where("lower(username) IN (?)", mentioned).find_each do |user|
          next if user == current_user
          Notification.create_or_group!(
            action: "mention",
            recipient: user,
            actor: current_user,
            notifiable: @post,
            data: { context: "caption" }
          )
        end
      end

      redirect_to root_path, notice: "Publicado"
    else
      @story = current_user.stories.build
      render :new, status: :unprocessable_entity
    end
  end

  def share
    @post = Post.find(params[:id])
    requested_friend_ids = Array(params[:friend_ids]).map(&:to_i).uniq
    requested_group_ids = Array(params[:group_ids]).map(&:to_i).uniq
    recipient_friend_ids = requested_friend_ids & current_user.friend_ids
    recipient_group_ids = requested_group_ids & current_user.group_ids

    if recipient_friend_ids.empty? && recipient_group_ids.empty?
      return respond_to do |format|
        format.turbo_stream { head :unprocessable_entity }
        format.html { redirect_back fallback_location: root_path, alert: "Selecciona al menos un destino." }
      end
    end

    ActiveRecord::Base.transaction do
      User.where(id: recipient_friend_ids).find_each do |recipient|
        conversation = Conversation.find_or_create_between!(current_user, recipient)
        conversation.messages.create!(sender: current_user, post: @post)
      end

      Group.where(id: recipient_group_ids).find_each do |group|
        group.messages.create!(sender: current_user, post: @post)
      end
    end

    respond_to do |format|
      format.turbo_stream { head :ok }
      format.html { redirect_back fallback_location: root_path, notice: "Post enviado." }
    end
  rescue ActiveRecord::RecordInvalid => e
    respond_to do |format|
      format.turbo_stream { head :unprocessable_entity }
      format.html { redirect_back fallback_location: root_path, alert: e.record.errors.full_messages.to_sentence }
    end
  end

  private

  def post_params
    params.require(:post).permit(:caption, :hashtags, media: [])
  end

  def close_path_from_referer
    referer = request.referer.to_s
    return root_path if referer.blank?
    return referer if referer.start_with?(root_url)

    root_path
  end
end
