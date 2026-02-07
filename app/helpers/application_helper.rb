module ApplicationHelper
  def theme_class
    return "theme-obsidian" unless user_signed_in?

    theme = current_user.feed_theme.presence || "obsidian"
    "theme-#{theme}"
  end

  def presence_status_text(user)
    return "En linea" if PresenceTracker.online_visible?(user)
    return "Activo recientemente" if user.last_seen_at.blank?

    "Activo hace #{time_ago_in_words(user.last_seen_at, locale: :es)}"
  end
end
