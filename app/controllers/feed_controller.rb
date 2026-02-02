class FeedController < ApplicationController
  before_action :authenticate_user!

  def index
  @posts = Post
  .includes(:user, media_attachments: :blob, comments: :user)
  .order(created_at: :desc)

end

end
