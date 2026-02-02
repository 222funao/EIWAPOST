class Post < ApplicationRecord
  belongs_to :user
  has_many_attached :media
  has_many :comments, dependent: :destroy
  validates :caption, length: { maximum: 2200 }
  validate :media_presence
  validate :media_types
  has_many :likes, dependent: :destroy

  def liked_by?(user)
    return false unless user
    likes.exists?(user_id: user.id)
  end
  
  private

  def media_presence
    errors.add(:media, "es obligatorio") unless media.attached?
  end

  def media_types
    return unless media.attached?

    allowed = %w[
      image/jpeg image/png image/webp image/gif
      video/mp4 video/webm video/quicktime
    ]

    media.each do |file|
      unless allowed.include?(file.content_type)
        errors.add(:media, "contiene un archivo no válido (solo imagen o video)")
        break
      end
    end
  end
end
