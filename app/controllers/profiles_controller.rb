# app/controllers/profiles_controller.rb
class ProfilesController < ApplicationController
  before_action :authenticate_user!

  def me
    @user = current_user
    @is_owner = true

    @posts = @user.posts.order(created_at: :desc)
    @liked_posts = liked_posts_for(@user)

    render :show
  end

  def show
    @user = User.find(params[:id])
    @is_owner = (@user == current_user)

    @posts = @user.posts.order(created_at: :desc)
    @liked_posts = liked_posts_for(@user)
  end

  def update
    @user = current_user
    @is_owner = true
    previous_invisible = @user.invisible?

    if @user.update(profile_params)
      if previous_invisible != @user.invisible?
        if @user.invisible?
          PresenceTracker.mark_invisible(@user)
        else
          PresenceTracker.heartbeat(@user)
        end
      end
      redirect_to profile_path, notice: "Perfil actualizado"
    else
      @posts = @user.posts.order(created_at: :desc)
      @liked_posts = liked_posts_for(@user)
      flash.now[:alert] = @user.errors.full_messages.first
      render :show, status: :unprocessable_entity
    end
  end

  private

  def profile_params
    params.require(:user).permit(:avatar, :bio, :invisible)
  end

  def liked_posts_for(user)
    Post.joins(:likes)
        .where(likes: { user_id: user.id })
        .select("posts.*, MAX(likes.created_at) AS liked_at")
        .group("posts.id")
        .order("liked_at DESC")
  end
end
