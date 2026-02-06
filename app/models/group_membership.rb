class GroupMembership < ApplicationRecord
  belongs_to :group
  belongs_to :user

  enum :role, { member: 0, leader: 1 }

  validates :user_id, uniqueness: { scope: :group_id }
end
