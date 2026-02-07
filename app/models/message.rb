class Message < ApplicationRecord
  belongs_to :conversation, optional: true
  belongs_to :group, optional: true
  belongs_to :sender, class_name: "User"
  belongs_to :story, optional: true
  belongs_to :post, optional: true

  has_many_attached :media

  validates :body, presence: true, unless: :content_attached?
  validate :conversation_or_group

  after_create_commit :broadcast_to_recipient

  def media_attached?
    media.attached?
  end

  def content_attached?
    media_attached? || story_id.present? || post_id.present?
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
      recipient_is_viewing = recipient_viewing_conversation?(recipient)
      first_message_in_conversation = !conversation.messages.where.not(id: id).exists?

      if recipient_is_viewing
        update_column(:read_at, Time.current)
      end

      broadcast_append_to(
        conversation.stream_for(recipient),
        target: "messages_list",
        partial: "messages/message",
        locals: { message: self, current_user: recipient }
      )
      broadcast_replace_to(
        conversation.stream_for(recipient),
        target: "conversation_read_status_#{conversation.id}",
        partial: "messages/read_status",
        locals: { conversation: conversation, current_user: recipient }
      )
      if recipient_is_viewing
        broadcast_replace_to(
          conversation.stream_for(sender),
          target: "conversation_read_status_#{conversation.id}",
          partial: "messages/read_status",
          locals: { conversation: conversation, current_user: sender }
        )
      end
      if first_message_in_conversation && recipient_is_viewing
        ConversationSyncJob.set(wait: 1.second).perform_later(
          conversation_id: conversation.id,
          recipient_id: recipient.id
        )
      end
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

  def recipient_viewing_conversation?(recipient)
    active_conversation_id = Rails.cache.read(active_conversation_cache_key(recipient.id))
    active_conversation_id.to_i == conversation.id
  end

  def active_conversation_cache_key(user_id)
    "active_conversation:user:#{user_id}"
  end
end
