Warden::Manager.after_set_user except: :fetch do |user, _auth, _opts|
  next unless user.is_a?(User)

  PresenceTracker.heartbeat(user)
end

Warden::Manager.before_logout do |user, _auth, _opts|
  next unless user.is_a?(User)

  PresenceTracker.mark_offline(user)
end
