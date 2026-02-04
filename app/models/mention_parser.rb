class MentionParser
  USERNAME_REGEX = /@([A-Za-z0-9_]{3,20})/

  def self.extract_usernames(text)
    return [] if text.blank?

    text.scan(USERNAME_REGEX)
        .flatten
        .map(&:downcase)
        .uniq
  end
end
