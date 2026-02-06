class Group < ApplicationRecord
  belongs_to :created_by, class_name: "User"

  has_one_attached :avatar
  has_many :group_memberships, dependent: :destroy
  has_many :members, through: :group_memberships, source: :user
  has_many :messages, dependent: :destroy

  validates :name, presence: true, length: { maximum: 60 }

  def allow_member_edit?
    allow_member_edit
  end

  def leader?(user)
    group_memberships.any? { |membership| membership.user_id == user.id && membership.leader? }
  end

  def leaders
    group_memberships.select(&:leader?)
  end

  def stream_for(user)
    "group_#{id}_user_#{user.id}"
  end
end
