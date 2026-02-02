class FollowsController < ApplicationController
  before_action :authenticate_user!
  before_action :set_user

  def create
    return head :unprocessable_entity if @user == current_user

    Follow.find_or_create_by!(follower: current_user, followed: @user)
    render json: { followed: true }
  end

  def destroy
    Follow.where(follower: current_user, followed: @user).destroy_all
    render json: { followed: false }
  end

  private

  def set_user
    @user = User.find(params[:user_id])
  end
end
