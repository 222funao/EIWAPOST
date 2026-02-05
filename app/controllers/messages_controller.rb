class MessagesController < ApplicationController
  before_action :authenticate_user!

  def index
    @friends = current_user.friends.order(:username)
    @active_user = active_user_from_params(@friends)

    if @active_user
      @conversation = Conversation.find_or_create_between!(current_user, @active_user)
      @messages =
      @conversation
          .messages
          .includes(:sender, :story, story: { media_attachment: :blob }, media_attachments: :blob)
          .order(:created_at)
    else
      @conversation = nil
      @messages = []
    end
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
            locals: { active_user: @active_user, message: @message }
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

  def message_params
    params.require(:message).permit(:body, :story_id, media: [])
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
