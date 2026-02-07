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

  def show
    Story.cleanup_expired!
    @story = Story.active.includes(:user, media_attachment: :blob).find(params[:id])
    @close_path = close_path_from_referer
    user = @story.user

    @stories_data = [
      {
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar.attached? ? url_for(user.avatar) : helpers.asset_path("avatars/default.png"),
          profile_url: public_profile_path(user),
          can_reply: current_user.friends_with?(user)
        },
        stories: [
          {
            id: @story.id,
            story_url: story_path(@story),
            media_url: url_for(@story.media),
            media_type: @story.media_kind,
            description: @story.description,
            liked: StoryLike.exists?(user_id: current_user.id, story_id: @story.id),
            created_at: @story.created_at.iso8601,
            expires_at: @story.expires_at.iso8601
          }
        ]
      }
    ]
  end

  private

  def story_params
    params.require(:story).permit(:media, :description)
  end

  def close_path_from_referer
    referer = request.referer.to_s
    return root_path if referer.blank?
    return referer if referer.start_with?(root_url)

    root_path
  end
end
