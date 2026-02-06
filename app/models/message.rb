class Message < ApplicationRecord
  belongs_to :conversation, optional: true
  belongs_to :group, optional: true
  belongs_to :sender, class_name: "User"
  belongs_to :story, optional: true

  has_many_attached :media

  validates :body, presence: true, unless: :media_attached?
  validate :conversation_or_group

  after_create_commit :broadcast_to_recipient

  def media_attached?
    media.attached?
  end

  private

  def broadcast_to_recipient
    if group
      group.members.find_each do |member|
        next if member.id == sender_id

        broadcast_append_to(
          group.stream_for(member),
          target: "messages_list",
          partial: "messages/message",
          locals: { message: self, current_user: member }
        )
        broadcast_message_indicator(member)
      end
    else
      recipient = conversation.other_for(sender)
      broadcast_append_to(
        conversation.stream_for(recipient),
        target: "messages_list",
        partial: "messages/message",
        locals: { message: self, current_user: recipient }
      )
      broadcast_message_indicator(recipient)
    end
  end

  def conversation_or_group
    return if conversation_id.present? ^ group_id.present?

    errors.add(:base, "Debe tener una conversacion o un grupo")
  end

  def broadcast_message_indicator(user)
    Turbo::StreamsChannel.broadcast_replace_to(
      "message_indicator_#{user.id}",
      target: "messages_indicator",
      partial: "shared/messages_indicator",
      locals: { has_unread_messages: user.has_unread_messages? }
    )
  end
end
