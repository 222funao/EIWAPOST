class Search::UsersController < ApplicationController
  before_action :authenticate_user!

  def index
    q = params[:q].to_s.strip

    users =
      if q.blank?
        User.none
      else
        User
          .where("username ILIKE ? OR email ILIKE ?", "%#{q}%", "%#{q}%")
          .where.not(id: current_user.id)
          .order(:username)
          .limit(20)
      end

    # Marca si ya lo sigues (ajusta si tu modelo Follow usa otros nombres)
    followed_ids =
      if defined?(Follow)
        Follow.where(follower_id: current_user.id, followed_id: users.select(:id)).pluck(:followed_id)
      else
        []
      end

    render json: users.map { |u|
      {
        id: u.id,
        username: u.username,
        profile_url: public_profile_path(u), # /profiles/:id
        avatar_url: avatar_url_for(u),
        followed: followed_ids.include?(u.id)
      }
    }
  end

  private

  def avatar_url_for(user)
    if user.avatar.attached?
      # only_path evita problemas de host en desarrollo
      rails_blob_url(user.avatar, only_path: true)
    else
      helpers.asset_path("avatars/default.png")
    end
  end
end
