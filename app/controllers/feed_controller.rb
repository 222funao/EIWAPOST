class FeedController < ApplicationController
  before_action :authenticate_user!

  def index
    Story.cleanup_expired!

    @query = params[:q].to_s.strip
    @posts = Post.includes(:user, media_attachments: :blob, comments: :user)

    if @query.present?
      escaped = ActiveRecord::Base.sanitize_sql_like(@query)
      @posts = @posts.joins(:user)
                     .where("posts.caption ILIKE :q OR users.username ILIKE :q", q: "%#{escaped}%")
    end

    @posts = @posts.order(created_at: :desc)

    following_ids = (current_user.following_ids + [current_user.id]).uniq
    stories = Story.active
                   .includes(:user, media_attachment: :blob)
                   .where(user_id: following_ids)
                   .order(created_at: :asc)

    @story_groups = stories.group_by(&:user)
    if @story_groups.key?(current_user)
      current_group = @story_groups[current_user]
      @story_groups = @story_groups.except(current_user)
      @story_groups = { current_user => current_group }.merge(@story_groups)
    end

    @stories_data = @story_groups.map do |user, items|
      {
        user: {
          id: user.id,
          username: user.username,
          avatar_url: user.avatar.attached? ? url_for(user.avatar) : helpers.asset_path("avatars/default.png"),
          profile_url: public_profile_path(user)
        },
        stories: items.map do |story|
          {
            id: story.id,
            story_url: story_path(story),
            media_url: url_for(story.media),
            media_type: story.media_kind,
            created_at: story.created_at.iso8601,
            expires_at: story.expires_at.iso8601
          }
        end
      }
    end
  end
end
