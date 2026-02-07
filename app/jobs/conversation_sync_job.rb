class ConversationSyncJob < ApplicationJob
  queue_as :default

  def perform(conversation_id:, recipient_id:)
    conversation = Conversation.find_by(id: conversation_id)
    recipient = User.find_by(id: recipient_id)
    return unless conversation && recipient

    messages =
      conversation
        .messages
        .includes(:sender, :story, story: { media_attachment: :blob }, media_attachments: :blob)
        .order(:created_at)

    Turbo::StreamsChannel.broadcast_replace_to(
      conversation.stream_for(recipient),
      target: "messages_list",
      partial: "messages/list",
      locals: { messages: messages, current_user: recipient }
    )
  end
end
