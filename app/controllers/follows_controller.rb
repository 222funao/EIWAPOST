class FollowsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  def create
    return head :unprocessable_entity if @user == current_user

    Follow.find_or_create_by!(follower: current_user, followed: @user)
    @user.reload
    current_user.reload
    respond_to do |format|
      format.turbo_stream
      format.json do
        render json: {
          followed: true,
          follows_you: @user.following?(current_user),
          friends: current_user.friends_with?(@user)
        }
      end
    end
  end

  def destroy
    Follow.where(follower: current_user, followed: @user).destroy_all
    @user.reload
    current_user.reload
    respond_to do |format|
      format.turbo_stream
      format.json do
        render json: {
          followed: false,
          follows_you: @user.following?(current_user),
          friends: false
        }
      end
    end
  end

  private

  def set_user
    @user = User.find(params[:id] || params[:user_id])
  end
end
