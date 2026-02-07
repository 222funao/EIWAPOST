class ApplicationController < ActionController::Base
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :load_notifications, if: :user_signed_in?
  before_action :load_message_indicator, if: :user_signed_in?
  before_action :clear_stale_active_conversation_cache, if: :user_signed_in?
  helper_method :has_unread_messages?
  helper_method :messages_page?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :email, :avatar])
    devise_parameter_sanitizer.permit(:account_update, keys: [:email, :username, :avatar])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:login])
  end

  def load_notifications
    @notifications = Notification.for_user(current_user).recent_first.limit(40).includes(:actor, :notifiable)
  end

  def load_message_indicator
    @has_unread_messages = current_user.has_unread_messages?
  end

  def has_unread_messages?(user = current_user)
    user.has_unread_messages?
  end

  def messages_page?
    controller_name == "messages"
  end

  def clear_stale_active_conversation_cache
    return unless request.get? || request.head?
    return if controller_name == "messages" && params[:user_id].present?

    Rails.cache.delete(active_conversation_cache_key(current_user.id))
  end

  def active_conversation_cache_key(user_id)
    "active_conversation:user:#{user_id}"
  end
end
