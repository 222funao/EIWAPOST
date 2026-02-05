class Notification < ApplicationRecord
  GROUP_WINDOW = 2.hours

  belongs_to :recipient, class_name: "User"
  belongs_to :actor, class_name: "User", optional: true
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :action, presence: true

  scope :for_user, ->(user) { where(recipient: user) }
  scope :recent_first, -> { order(Arel.sql("COALESCE(updated_at, created_at) DESC")) }

  def self.stream_for(user)
    [user, :notifications]
  end

  def self.create_or_group!(action:, recipient:, actor:, notifiable: nil, data: {})
    return if recipient == actor

    if %w[like comment story_like].include?(action) && notifiable.present?
      existing = where(recipient: recipient, action: action, notifiable: notifiable)
                 .where("updated_at >= ?", GROUP_WINDOW.ago)
                 .order(updated_at: :desc)
                 .first
      if existing
        existing.update!(actor: actor, group_count: existing.group_count + 1)
        existing.broadcast_panel
        return existing
      end
    end

    notification = create!(
      recipient: recipient,
      actor: actor,
      action: action,
      notifiable: notifiable,
      group_count: 1,
      data: data
    )
    notification.broadcast_panel
    notification
  end

  def broadcast_panel
    return unless recipient

    notifications = Notification
      .for_user(recipient)
      .recent_first
      .limit(40)
      .includes(:actor, :notifiable)

    broadcast_update_to(
      *Notification.stream_for(recipient),
      target: "notifications_panel_content",
      partial: "shared/notifications_panel_content",
      locals: { notifications: notifications }
    )

    quick_notifications = Notification
      .for_user(recipient)
      .recent_first
      .limit(5)
      .includes(:actor, :notifiable)

    broadcast_update_to(
      *Notification.stream_for(recipient),
      target: "quick_notifications_list",
      partial: "shared/quick_notifications_list",
      locals: { notifications: quick_notifications }
    )
  end
end
