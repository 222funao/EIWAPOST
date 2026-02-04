class ApplicationController < ActionController::Base
  before_action :configure_permitted_parameters, if: :devise_controller?
  before_action :load_notifications, if: :user_signed_in?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:username, :email, :avatar])
    devise_parameter_sanitizer.permit(:account_update, keys: [:email, :username, :avatar])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:login])
  end

  def load_notifications
    @notifications = Notification.for_user(current_user).recent_first.limit(40).includes(:actor, :notifiable)
  end
end
