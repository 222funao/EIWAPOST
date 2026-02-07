class PresencesController < ApplicationController
  before_action :authenticate_user!
  skip_forgery_protection only: [:offline]

  def heartbeat
    PresenceTracker.heartbeat(current_user)
    head :ok
  end

  def offline
    PresenceTracker.mark_offline(current_user)
    head :ok
  end
end
