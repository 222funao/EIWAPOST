class Notification < ApplicationRecord
  GROUP_WINDOW = 2.hours

  belongs_to :recipient, class_name: "User"
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :action, presence: true

  scope :for_user, ->(user) { where(recipient: user) }
  scope :recent_first, -> { order(Arel.sql("COALESCE(updated_at, created_at) DESC")) }

  def self.create_or_group!(action:, recipient:, actor:, notifiable: nil, data: {})
    return if recipient == actor

    if %w[like comment].include?(action) && notifiable.present?
      existing = where(recipient: recipient, action: action, notifiable: notifiable)
                 .where("updated_at >= ?", GROUP_WINDOW.ago)
                 .order(updated_at: :desc)
                 .first
      if existing
        existing.update!(actor: actor, group_count: existing.group_count + 1)
        return existing
      end
    end

    create!(
      recipient: recipient,
      actor: actor,
      action: action,
      notifiable: notifiable,
      group_count: 1,
      data: data
    )
  end
end
