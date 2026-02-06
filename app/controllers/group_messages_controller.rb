class GroupMessagesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_group
  before_action :ensure_member

  def create
    @message = @group.messages.new(message_params.merge(sender: current_user))

    if @message.save
      respond_to do |format|
        format.turbo_stream
        format.html { redirect_to messages_path(group_id: @group.id) }
      end
    else
      respond_to do |format|
        format.turbo_stream do
          render turbo_stream: turbo_stream.replace(
            "message_form",
            partial: "messages/form",
            locals: { form_url: group_messages_path(@group, format: :turbo_stream), message: @message }
          )
        end
        format.html do
          redirect_to messages_path(group_id: @group.id),
                      alert: @message.errors.full_messages.first
        end
      end
    end
  end

  private

  def set_group
    @group = current_user.groups.find(params[:group_id])
  end

  def ensure_member
    return if @group.group_memberships.exists?(user_id: current_user.id)

    head :forbidden
  end

  def message_params
    params.require(:message).permit(:body, :story_id, media: [])
  end
end
