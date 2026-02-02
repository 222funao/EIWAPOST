class LikesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_post

  def create
    @post.likes.find_or_create_by!(user: current_user)
    @post.reload

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "like_button_post_#{@post.id}",
          partial: "posts/like_button",
          locals: { post: @post }
        )
      end
      format.html { redirect_back fallback_location: root_path }
    end
  end

  def destroy
    @post.likes.where(user: current_user).destroy_all
    @post.reload

    respond_to do |format|
      format.turbo_stream do
        render turbo_stream: turbo_stream.replace(
          "like_button_post_#{@post.id}",
          partial: "posts/like_button",
          locals: { post: @post }
        )
      end
      format.html { redirect_back fallback_location: root_path }
    end
  end

  private

  def set_post
    @post = Post.find(params[:post_id])
  end
end
