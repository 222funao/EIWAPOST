class PersonalizationsController < ApplicationController
  before_action :authenticate_user!

  def edit
  end

  def update
    if current_user.update(personalization_params)
      redirect_to personalizacion_path
    else
      render :edit, status: :unprocessable_entity
    end
  end

  private

  def personalization_params
    params.require(:user).permit(
      :feed_posts_scope,
      :feed_include_own_posts,
      :feed_stories_scope,
      :feed_theme,
      :feed_icon_style
    )
  end
end
