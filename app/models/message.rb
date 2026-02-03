class Message < ApplicationRecord
  belongs_to :conversation
  belongs_to :sender, class_name: "User"

  has_many_attached :media

  validates :body, presence: true, unless: :media_attached?

  def media_attached?
    media.attached?
  end
end
