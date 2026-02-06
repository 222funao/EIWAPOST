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

    post_scope = current_user.feed_posts_scope.presence || "all"
    include_own_posts = current_user.feed_include_own_posts.nil? ? true : current_user.feed_include_own_posts

    if post_scope == "following"
      allowed_ids = current_user.following_ids
      allowed_ids << current_user.id if include_own_posts
      @posts = @posts.where(user_id: allowed_ids)
    elsif !include_own_posts
      @posts = @posts.where.not(user_id: current_user.id)
    end

    @posts = @posts.order(created_at: :desc)

    friend_ids = current_user.friend_ids
    story_scope = current_user.feed_stories_scope.presence || "all"
    stories = Story.active
                   .includes(:user, media_attachment: :blob)
                   .order(created_at: :asc)
    if story_scope == "following"
      allowed_story_ids = (current_user.following_ids + [current_user.id]).uniq
      stories = stories.where(user_id: allowed_story_ids)
    end

    @story_groups = stories.group_by(&:user)
    liked_story_ids = StoryLike.where(user_id: current_user.id, story_id: stories.map(&:id)).pluck(:story_id)
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
          profile_url: public_profile_path(user),
          can_reply: friend_ids.include?(user.id)
        },
        stories: items.map do |story|
          {
            id: story.id,
            story_url: story_path(story),
            media_url: url_for(story.media),
            media_type: story.media_kind,
            description: story.description,
            liked: liked_story_ids.include?(story.id),
            created_at: story.created_at.iso8601,
            expires_at: story.expires_at.iso8601
          }
        end
      }
    end
  end
end
