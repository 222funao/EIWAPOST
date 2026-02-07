class TrendsController < ApplicationController
  before_action :authenticate_user!

  def show
    @trend = Trend.find_by!(name: params[:name].to_s.downcase)
    @share_friends = current_user.friends.includes(avatar_attachment: :blob).order(:username)
    @share_groups = current_user.groups.includes(avatar_attachment: :blob).order(:name)
    @posts = @trend.posts
                   .includes(:user, media_attachments: :blob, comments: :user)
                   .order(created_at: :desc)
    @top_trends = Trend.top_with_post_counts(5)
  end
end
