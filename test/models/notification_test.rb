require "test_helper"

class NotificationTest < ActiveSupport::TestCase
  test "follow notifications are idempotent per recipient and actor" do
    recipient = create_user!("recipient")
    actor = create_user!("actor")

    first = Notification.create_or_group!(
      action: "follow",
      recipient: recipient,
      actor: actor
    )

    second = Notification.create_or_group!(
      action: "follow",
      recipient: recipient,
      actor: actor
    )

    scope = Notification.where(
      recipient: recipient,
      actor: actor,
      action: "follow",
      notifiable_type: nil,
      notifiable_id: nil
    )

    assert_equal first.id, second.id
    assert_equal 1, scope.count
  end

  private

  def create_user!(prefix)
    token = "#{prefix}-#{SecureRandom.hex(4)}"
    User.create!(
      username: token.tr("-", "_"),
      email: "#{token}@example.com",
      password: "password123",
      password_confirmation: "password123"
    )
  end
end
