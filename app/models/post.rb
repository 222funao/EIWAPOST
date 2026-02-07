class Post < ApplicationRecord
  belongs_to :user
  has_many_attached :media
  has_many :comments, dependent: :destroy
  has_many :post_trends, dependent: :destroy
  has_many :trends, through: :post_trends
  validates :caption, length: { maximum: 2200 }
  validate :media_presence
  validate :media_types
  has_many :likes, dependent: :destroy
  before_validation :normalize_hashtags
  after_commit :sync_trends, on: [:create, :update], if: :saved_change_to_hashtags?

  HASHTAG_REGEX = /#([\p{L}\p{N}_]+)/u

  def liked_by?(user)
    return false unless user
    likes.exists?(user_id: user.id)
  end

  def hashtag_names
    hashtags.to_s.scan(HASHTAG_REGEX).flatten.map(&:downcase).uniq
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

  def normalize_hashtags
    tags = hashtags.to_s.scan(HASHTAG_REGEX).flatten.map(&:downcase).uniq
    self.hashtags = tags.any? ? tags.map { |tag| "##{tag}" }.join(" ") : nil
  end

  def sync_trends
    current_trends = hashtag_names.map { |name| Trend.find_or_create_by!(name: name) }
    trends.replace(current_trends)
  end
end
