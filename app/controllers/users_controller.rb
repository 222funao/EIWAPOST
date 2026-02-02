class UsersController < ApplicationController
  before_action :authenticate_user!

  def search
    q = params[:q].to_s.strip

    users =
      if q.present?
        User
          .where("username ILIKE ? OR email ILIKE ?", "%#{q}%", "%#{q}%")
          .where.not(id: current_user.id)
          .order(:username)
          .limit(20)
      else
        User.none
      end

    followed_ids =
      if users.any?
        Follow.where(follower_id: current_user.id, followed_id: users.select(:id)).pluck(:followed_id)
      else
        []
      end

    follows_you_ids =
      if users.any?
        Follow.where(followed_id: current_user.id, follower_id: users.select(:id)).pluck(:follower_id)
      else
        []
      end

    render json: users.map { |u|
      {
        id: u.id,
        username: u.username,
        avatar_url: avatar_path_for(u),
        profile_url: public_profile_path(u),
        followed: followed_ids.include?(u.id),
        follows_you: follows_you_ids.include?(u.id)
      }
    }
  end

  private

  def avatar_path_for(user)
    if user.avatar.attached?
      rails_blob_path(user.avatar, only_path: true)
    else
      ActionController::Base.helpers.image_path("avatars/default.png")
    end
  end
end
