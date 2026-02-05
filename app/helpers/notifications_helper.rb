module NotificationsHelper
  def notification_message(notification)
    action = notification.action
    actor = notification.actor
    if notification.group_count.to_i > 1 && %w[like comment].include?(action)
      return action == "like" ? "Varias personas dieron like a tu post" : "Varias personas comentaron tu post"
    end

    return "Te empezó a seguir" unless actor

    case action
    when "follow"
      "comenzó a seguirte"
    when "like"
      "dio like a tu post"
    when "comment"
      "comentó tu post"
    when "mention"
      context = notification.data["context"]
      context == "comment" ? "te mencionó en un comentario" : "te mencionó en un post"
    else
      "tienes una notificación"
    end
  end

  def notification_actor_link(notification)
    actor = notification.actor
    return nil unless actor

    link_to actor.username, public_profile_path(actor), class: "font-semibold text-zinc-100 hover:underline"
  end

  def notification_post_preview(notification)
    post = notification.notifiable
    return nil unless post.is_a?(Post)

    media = post.media.first
    return nil unless media

    link_to post_path(post), class: "shrink-0" do
      blob_path = rails_blob_path(media, only_path: true)
      if media.content_type&.start_with?("image/")
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
