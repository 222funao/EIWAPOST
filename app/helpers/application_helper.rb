module ApplicationHelper
  def theme_class
    return "theme-obsidian" unless user_signed_in?

    theme = current_user.feed_theme.presence || "obsidian"
    "theme-#{theme}"
  end
end
