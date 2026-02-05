class StoryLikesController < ApplicationController
  before_action :authenticate_user!
  before_action :set_story

  def create
    like = @story.story_likes.find_or_create_by!(user: current_user)
    if like.previous_changes.key?("id")
      Notification.create_or_group!(
        action: "story_like",
        recipient: @story.user,
        actor: current_user,
        notifiable: @story,
        data: { story_url: story_path(@story) }
      )
    end
    render json: { liked: true }
  end

  def destroy
    @story.story_likes.where(user: current_user).destroy_all
    render json: { liked: false }
  end

  private

  def set_story
    @story = Story.active.find(params[:story_id])
  end
end
