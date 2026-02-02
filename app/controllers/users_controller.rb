class UsersController < ApplicationController
  before_action :authenticate_user!

def users
  q = params[:q].to_s.strip

  users = User.where("username ILIKE ?", "%#{q}%").limit(20)

  render json: users.map { |u|
    {
      id: u.id,
      username: u.username,
      profile_url: public_profile_path(u),
      avatar_url: (u.avatar.attached? ? url_for(u.avatar) : ActionController::Base.helpers.asset_path("avatars/default.png")),
      followed: current_user.following?(u)
      follow_url: user_follow_path(u)
    }
  }
end

  def search
    q = params[:q].to_s.strip

    users =
      if q.present?
        User
          .where("username ILIKE ?", "%#{q}%")
          .where.not(id: current_user.id)
          .order(:username)
          .limit(20)
      else
        User.none
      end

    render json: users.map { |u|
      {
        id: u.id,
        username: u.username,
        avatar_url: avatar_path_for(u),
        profile_url: public_profile_path(u.id)
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
