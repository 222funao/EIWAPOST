class User < ApplicationRecord
  has_many :likes, dependent: :destroy
  has_many :liked_posts, through: :likes, source: :post
  has_many :comments, dependent: :destroy
  has_many :posts, dependent: :destroy
  has_many :stories, dependent: :destroy
  has_many :story_likes, dependent: :destroy
  has_one_attached :avatar
  has_many :notifications, foreign_key: :recipient_id, dependent: :destroy
  has_many :sent_notifications, class_name: "Notification", foreign_key: :actor_id, dependent: :nullify
  has_many :group_memberships, dependent: :destroy
  has_many :groups, through: :group_memberships

  has_many :active_follows, class_name: "Follow", foreign_key: :follower_id, dependent: :destroy
  has_many :passive_follows, class_name: "Follow", foreign_key: :followed_id, dependent: :destroy
  has_many :following, through: :active_follows, source: :followed
  has_many :followers, through: :passive_follows, source: :follower

  attr_accessor :login

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :username, presence: true,
                       uniqueness: { case_sensitive: false },
                       length: { minimum: 3, maximum: 20 },
                       format: { with: /\A[a-zA-Z0-9_]+\z/, message: "solo letras, nÃºmeros y _" }

  before_create :set_default_avatar

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    login = conditions.delete(:login)&.downcase

    where(conditions.to_h)
      .where(["lower(username) = :value", { value: login }])
      .first
  end

  def following?(user)
    Follow.exists?(follower_id: id, followed_id: user.id)
  end

  # "Amigos" = se siguen ambos
  def friends_with?(user)
    following?(user) && user.following?(self)
  end

  def friend_ids
    followed_ids = Follow.where(follower_id: id).pluck(:followed_id)
    return [] if followed_ids.empty?

    Follow.where(followed_id: id, follower_id: followed_ids).pluck(:follower_id)
  end

  def friends
    User.where(id: friend_ids)
  end

  private

  def set_default_avatar
    return if avatar.attached?

    # Ruta del avatar por defecto en /app/assets/images/...
    default_path = Rails.root.join("app/assets/images/avatars/default.png")
    return unless File.exist?(default_path)

    avatar.attach(
      io: File.open(default_path),
      filename: "default.png",
      content_type: "image/png"
    )
  end
end
