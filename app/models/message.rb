class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  has_many_attached :media

  validates :body, presence: true, unless: :media_attached?

  after_create_commit :broadcast_to_recipient

  def media_attached?
    media.attached?
  end

  private

  def broadcast_to_recipient
    recipient = conversation.other_for(sender)
    broadcast_append_to(
      conversation.stream_for(recipient),
      target: "messages_list",
      partial: "messages/message",
      locals: { message: self, current_user: recipient }
    )
  end
end
