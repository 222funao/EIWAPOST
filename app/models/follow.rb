# app/models/follow.rb
class Follow < ApplicationRecord
  belongs_to :follower, class_name: "User", counter_cache: :following_count
  belongs_to :followed, class_name: "User", counter_cache: :followers_count

  validates :follower_id, uniqueness: { scope: :followed_id }
  validate :not_self

  private

  def not_self
    errors.add(:followed_id, "no puedes seguirte a ti mismo") if follower_id == followed_id
  end
end
