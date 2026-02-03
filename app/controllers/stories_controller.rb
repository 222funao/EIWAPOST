class StoriesController < ApplicationController
  before_action :authenticate_user!

  def create
    Story.cleanup_expired!

    @story = current_user.stories.build(story_params)
    if @story.save
      redirect_to root_path, notice: "Historia publicada"
    else
      @post = current_user.posts.build
      render "posts/new", status: :unprocessable_entity
    end
  end

  private

  def story_params
    params.require(:story).permit(:media)
  end
end
