class Conversation < ApplicationRecord
  belongs_to :user_a, class_name: "User"
  belongs_to :user_b, class_name: "User"
  has_many :messages, dependent: :destroy

  validates :user_a_id, uniqueness: { scope: :user_b_id }
  validate :different_users

  def self.between(user1, user2)
    a, b = [user1, user2].sort_by(&:id)
    find_by(user_a: a, user_b: b)
  end

  def self.find_or_create_between!(user1, user2)
    a, b = [user1, user2].sort_by(&:id)
    find_or_create_by!(user_a: a, user_b: b)
  end

  def other_for(user)
    user.id == user_a_id ? user_b : user_a
  end

  private

  def different_users
    errors.add(:user_b_id, "no puede ser el mismo usuario") if user_a_id == user_b_id
  end
end
