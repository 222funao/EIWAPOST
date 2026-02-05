module NotificationsHelper
  def notification_message(notification)
    action = notification.action
    actor = notification.actor
    if notification.group_count.to_i > 1 && %w[like comment story_like].include?(action)
      return action == "like" ? "Varias personas dieron like a tu post" : (action == "story_like" ? "Varias personas dieron like a tu historia" : "Varias personas comentaron tu post")
    end

    return "Te empezo a seguir" unless actor

    case action
    when "follow"
      "comenzo a seguirte"
    when "like"
      "dio like a tu post"
    when "story_like"
      "dio like a tu historia"
    when "comment"
      "comento tu post"
    when "story_reply"
      "respondio tu historia"
    when "mention"
      context = notification.data["context"]
      context == "comment" ? "te menciono en un comentario" : "te menciono en un post"
    else
      "tienes una notificacion"
    end
  end

  def notification_actor_link(notification)
    actor = notification.actor
    return nil unless actor

    link_to actor.username, public_profile_path(actor), class: "font-semibold text-zinc-100 hover:underline"
  end

  def notification_post_preview(notification)
    item = notification.notifiable
    return nil unless item.is_a?(Post) || item.is_a?(Story)

    media =
      if item.is_a?(Post)
        item.media.first
      else
        item.media if item.media.attached?
      end
    return nil unless media

    destination =
      if item.is_a?(Post)
        post_path(item)
      else
        notification.data["story_url"].presence || story_path(item)
      end

    link_to destination, class: "shrink-0" do
      blob_path = rails_blob_path(media, only_path: true)
      content_type =
        if media.respond_to?(:content_type)
          media.content_type
        else
          media.blob&.content_type
        end
      if content_type&.start_with?("image/")
        image_tag blob_path, class: "h-12 w-12 rounded-lg object-cover"
      else
        content_tag(:div, class: "relative h-12 w-12 overflow-hidden rounded-lg bg-black") do
          safe_join(
            [
              video_tag(blob_path, class: "h-full w-full object-cover", muted: true, playsinline: true),
              content_tag(:span, "", class: "absolute inset-0 bg-black/20")
            ]
          )
        end
      end
    end
  end
end
