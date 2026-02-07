class PresenceTracker
  ONLINE_TTL = 45.seconds
  LAST_SEEN_WRITE_TTL = 60.seconds

  class << self
    def heartbeat(user)
      if user.invisible?
        Rails.cache.delete(online_key(user.id))
        broadcast(user)
        return
      end

      now = Time.current
      Rails.cache.write(online_key(user.id), true, expires_in: ONLINE_TTL)
      write_last_seen_if_needed(user, now)
      broadcast(user)
    end

    def mark_offline(user)
      Rails.cache.delete(online_key(user.id))
      write_last_seen(user, Time.current) unless user.invisible?
      broadcast(user)
    end

    def mark_invisible(user)
      Rails.cache.delete(online_key(user.id))
      write_last_seen(user, Time.current)
      broadcast(user)
    end

    def online_visible?(user)
      return false if user.invisible?
      Rails.cache.read(online_key(user.id)).present?
    end

    def payload(user)
      {
        user_id: user.id,
        online: online_visible?(user),
        invisible: user.invisible?,
        last_seen_at: user.last_seen_at&.iso8601
      }
    end

    def broadcast(user)
      ActionCable.server.broadcast("presence", payload(user))
    end

    private

    def online_key(user_id)
      "presence:user:#{user_id}:online"
    end

    def last_seen_write_key(user_id)
      "presence:user:#{user_id}:last_seen_write"
    end

    def write_last_seen_if_needed(user, now)
      key = last_seen_write_key(user.id)
      return if Rails.cache.read(key).present?

      write_last_seen(user, now)
      Rails.cache.write(key, true, expires_in: LAST_SEEN_WRITE_TTL)
    end

    def write_last_seen(user, time)
      return if user.last_seen_at.present? && user.last_seen_at >= time - 1.second

      user.update_column(:last_seen_at, time)
    end
  end
end
