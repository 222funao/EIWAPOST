module MentionsHelper
  def render_with_mentions(text)
    return "" if text.blank?

    usernames = MentionParser.extract_usernames(text)
    return ERB::Util.html_escape(text) if usernames.empty?

    users = User.where("lower(username) IN (?)", usernames).index_by { |u| u.username.downcase }
    escaped = ERB::Util.html_escape(text)

    linked = escaped.gsub(MentionParser::USERNAME_REGEX) do |match|
      username = Regexp.last_match(1)
      user = users[username.downcase]
      if user
        link_to("@#{username}", public_profile_path(user), class: "text-sky-400 hover:underline")
      else
        match
      end
    end

    linked.html_safe
  end
end
