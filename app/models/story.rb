class Story < ApplicationRecord
  belongs_to :user
  has_one_attached :media
  has_many :story_likes, dependent: :destroy

  validates :media, presence: true
  validates :description, length: { maximum: 140 }, allow_blank: true
  validate :media_type_allowed

  scope :active, -> { where("expires_at > ?", Time.current) }
  scope :expired, -> { where("expires_at <= ?", Time.current) }

  before_create :set_expires_at

  def self.cleanup_expired!
    expired.find_each(&:destroy)
  end

  def media_kind
    return "image" if media.image?
    return "video" if media.video?

    "unknown"
  end

  private

  def set_expires_at
    self.expires_at ||= 24.hours.from_now
  end

  def media_type_allowed
    return unless media.attached?

    unless media.image? || media.video?
      errors.add(:media, "debe ser una imagen o un video")
    end
  end
end
