class PostsController < ApplicationController
  before_action :authenticate_user!

  def new
    @post = current_user.posts.build
    @story = current_user.stories.build
  end

  def show
    @post = Post.includes(:user, comments: :user, media_attachments: :blob).find(params[:id])
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

  private

  def post_params
    params.require(:post).permit(:caption, media: [])
  end
end
