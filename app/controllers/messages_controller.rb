class MessagesController < ApplicationController
  before_action :authenticate_user!

  def index
    @friends = current_user.friends.order(:username)
    @groups = current_user.groups.order(:name)
    @active_group = active_group_from_params(@groups)
    @active_user = @active_group ? nil : active_user_from_params(@friends)

    if @active_group
      load_group_messages
    elsif @active_user
      @conversation = Conversation.find_or_create_between!(current_user, @active_user)
      @messages =
        @conversation
          .messages
          .includes(:sender, :story, story: { media_attachment: :blob }, media_attachments: :blob)
          .order(:created_at)
      unread_scope = @conversation.messages.where(sender_id: @active_user.id, read_at: nil)
      @unread_count = unread_scope.count
      @first_unread_id = unread_scope.order(:created_at).limit(1).pluck(:id).first
      marked_count = unread_scope.update_all(read_at: Time.current)

      if marked_count.positive?
        Turbo::StreamsChannel.broadcast_replace_to(
          @conversation.stream_for(@active_user),
          target: "conversation_read_status_#{@conversation.id}",
          partial: "messages/read_status",
          locals: { conversation: @conversation, current_user: @active_user }
        )
      end
    else
      @conversation = nil
      @messages = []
      @unread_count = 0
      @first_unread_id = nil
    end

    @friend_summaries = build_friend_summaries(@friends)
    @group_summaries = build_group_summaries(@groups)
  end

  def create
    @active_user = User.find(params[:user_id])
    return head :forbidden unless current_user.friends_with?(@active_user)

    @conversation = Conversation.find_or_create_between!(current_user, @active_user)
    @message = @conversation.messages.new(message_params.merge(sender: current_user))
    attach_story_reply

    if @message.save
      notify_story_reply(@message)
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to messages_path(user_id: @active_user.id) }
      end
    else
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "message_form",
            partial: "messages/form",
            locals: {
              form_url: user_messages_path(@active_user, format: :turbo_stream),
              message: @message
            }
          )
        end
        format.html do
          redirect_to messages_path(user_id: @active_user.id),
                      alert: @message.errors.full_messages.first
        end
      end
    end
  end

  private

  def active_user_from_params(friends)
    return nil if params[:user_id].blank?
    friends.find { |u| u.id == params[:user_id].to_i }
  end

  def active_group_from_params(groups)
    return nil if params[:group_id].blank?
    groups.find { |g| g.id == params[:group_id].to_i }
  end

  def message_params
    params.require(:message).permit(:body, :story_id, media: [])
  end

  def build_friend_summaries(friends)
    summaries = {}
    friends.each do |friend|
      conversation = Conversation.between(current_user, friend)
      last_message = conversation&.messages&.order(created_at: :desc)&.first
      unread_count =
        if conversation
          conversation.messages.where(sender_id: friend.id, read_at: nil).count
        else
          0
        end
      summaries[friend.id] = {
        last_message: last_message,
        unread_count: unread_count
      }
    end
    summaries
  end

  def build_group_summaries(groups)
    summaries = {}
    groups.each do |group|
      membership = group.group_memberships.find { |m| m.user_id == current_user.id }
      last_message = group.messages.order(created_at: :desc).first
      unread_scope = group.messages.where.not(sender_id: current_user.id)
      if membership&.last_read_at
        unread_scope = unread_scope.where("created_at > ?", membership.last_read_at)
      end
      summaries[group.id] = {
        last_message: last_message,
        unread_count: unread_scope.count
      }
    end
    summaries
  end

  def load_group_messages
    @conversation = nil
    @messages =
      @active_group
        .messages
        .includes(:sender, :story, story: { media_attachment: :blob }, media_attachments: :blob)
        .order(:created_at)

    membership = @active_group.group_memberships.find { |m| m.user_id == current_user.id }
    @group_memberships =
      @active_group
        .group_memberships
        .includes(:user)
        .order(role: :desc, created_at: :asc)
    @available_friends = current_user.friends.where.not(id: @active_group.member_ids).order(:username)
    @can_manage_group = membership&.leader?

    unread_scope = @active_group.messages.where.not(sender_id: current_user.id)
    if membership&.last_read_at
      unread_scope = unread_scope.where("created_at > ?", membership.last_read_at)
    end
    @unread_count = unread_scope.count
    @first_unread_id = unread_scope.order(:created_at).limit(1).pluck(:id).first
    membership&.update!(last_read_at: Time.current)
  end

  def notify_story_reply(message)
    story_id = params[:story_id]
    return if story_id.blank?

    story = Story.find_by(id: story_id)
    return unless story

    Notification.create_or_group!(
      action: "story_reply",
      recipient: story.user,
      actor: current_user,
      notifiable: story,
      data: { story_url: story_path(story) }
    )
  end

  def attach_story_reply
    story_id = params[:story_id] || params.dig(:message, :story_id)
    return if story_id.blank?

    story = Story.active.find_by(id: story_id)
    return unless story
    return unless story.user_id == @active_user.id

    @message.story = story
  end
end
