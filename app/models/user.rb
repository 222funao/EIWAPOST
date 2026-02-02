class User < ApplicationRecord
has_many :likes, dependent: :destroy
  has_many :liked_posts, through: :likes, source: :post
  has_many :comments, dependent: :destroy
has_many :posts, dependent: :destroy
has_one_attached :avatar

  
  attr_accessor :login

  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  validates :username, presence: true,
                       uniqueness: { case_sensitive: false },
                       length: { minimum: 3, maximum: 20 },
                       format: { with: /\A[a-zA-Z0-9_]+\z/, message: "solo letras, números y _" }

 

  def self.find_for_database_authentication(warden_conditions)
    conditions = warden_conditions.dup
    login = conditions.delete(:login)&.downcase

    where(conditions.to_h)
      .where(["lower(username) = :value", { value: login }])
      .first
  end

  private

class User < ApplicationRecord
  # Si usas ActiveStorage para avatar
  has_one_attached :avatar

  before_create :set_default_avatar

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

 has_many :active_follows,  class_name: "Follow", foreign_key: :follower_id, dependent: :destroy
  has_many :passive_follows, class_name: "Follow", foreign_key: :followed_id, dependent: :destroy

  has_many :following, through: :active_follows,  source: :followed
  has_many :followers, through: :passive_follows, source: :follower

  def following?(user)
    Follow.exists?(follower_id: id, followed_id: user.id)
  end

  # “Amigos” = se siguen ambos
  def friends_with?(user)
    following?(user) && user.following?(self)
  end
end
