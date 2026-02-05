import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = [
    "modal",
    "image",
    "video",
    "progress",
    "username",
    "avatar",
    "time",
    "soundToggle",
    "list",
    "storyLink",
    "description",
    "replyForm",
    "replyInput",
    "replyIndicator",
    "pauseToggle",
    "likeButton",
    "likeIcon",
    "likeIconFilled",
    "replyStoryId"
  ]
  static values = {
    stories: Array,
    imageDuration: Number,
    currentUserId: Number,
    startStoryId: Number,
    autoOpen: Boolean,
    closeUrl: String,
    messagesPathTemplate: String,
    storyLikePathTemplate: String
  }

  connect() {
    this._timer = null
    this._currentUserIndex = 0
    this._currentStoryIndex = 0
    this._muted = false
    this._paused = false
    this._timerStartedAt = null
    this._timerRemainingMs = null
    this._likedOverrides = new Map()
    this._viewedIds = new Set()
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close()
      if (e.key === "ArrowRight") this.next()
      if (e.key === "ArrowLeft") this.prev()
    }

    this._loadViewed()
    this._applyViewedState()
    this._applyOrdering()

    if (this.autoOpenValue && this.hasStartStoryIdValue) {
      this._openToStoryId(this.startStoryIdValue)
    }
  }

  open(event) {
    const userId = Number(event?.params?.userId)
    const idx = this._indexForUserId(userId) ?? 0
    this._muted = false
    this._show(idx, 0)
    this.modalTarget.classList.remove("hidden")
    document.addEventListener("keydown", this._onKeydown)
  }

  close() {
    this._clearTimer()
    this._stopVideo()
    this._paused = false
    if (this.hasCloseUrlValue && this.closeUrlValue) {
      window.location.href = this.closeUrlValue
      return
    }
    this.modalTarget.classList.add("hidden")
    document.removeEventListener("keydown", this._onKeydown)
    this._applyOrdering()
  }

  next() {
    const group = this._currentGroup()
    if (!group) return this.close()

    if (this._currentStoryIndex < group.stories.length - 1) {
      this._show(this._currentUserIndex, this._currentStoryIndex + 1)
      return
    }

    if (this._currentUserIndex < this.storiesValue.length - 1) {
      this._show(this._currentUserIndex + 1, 0)
      return
    }

    this.close()
  }

  prev() {
    const group = this._currentGroup()
    if (!group) return this.close()

    if (this._currentStoryIndex > 0) {
      this._show(this._currentUserIndex, this._currentStoryIndex - 1)
      return
    }

    if (this._currentUserIndex > 0) {
      const prevGroup = this.storiesValue[this._currentUserIndex - 1]
      this._show(this._currentUserIndex - 1, prevGroup.stories.length - 1)
      return
    }
  }

  _show(userIndex, storyIndex) {
    this._currentUserIndex = userIndex
    this._currentStoryIndex = storyIndex

    const group = this._currentGroup()
    if (!group) return this.close()

    const story = group.stories[storyIndex]
    this._currentStoryId = story.id
    this._renderHeader(group.user, story)
    this._renderDescription(story)
    this._renderReply(group.user)
    this._renderLike(story)
    this._renderProgress(group, storyIndex)
    this._renderMedia(story)
    this._setPauseButtonState()
    this._markViewed(group.user.id)
  }

  _renderHeader(user, story) {
    this.usernameTarget.textContent = user.username
    this.avatarTarget.src = user.avatar_url
    this.timeTarget.textContent = this._timeAgo(story.created_at)
    if (this.hasStoryLinkTarget) {
      this.storyLinkTarget.href = story.story_url || `/stories/${story.id}`
    }
  }

  _renderLike(story) {
    if (!this.hasLikeButtonTarget) return
    this._currentStoryId = story.id
    const override = this._likedOverrides.get(Number(story.id))
    const liked = override === undefined ? Boolean(story.liked) : override
    this.likeButtonTarget.classList.toggle("text-rose-400", liked)
    this.likeButtonTarget.classList.toggle("text-white/90", !liked)
    this.likeButtonTarget.dataset.liked = liked ? "true" : "false"
    if (this.hasLikeIconTarget) {
      this.likeIconTarget.classList.toggle("hidden", liked)
    }
    if (this.hasLikeIconFilledTarget) {
      this.likeIconFilledTarget.classList.toggle("hidden", !liked)
    }
  }

  _renderDescription(story) {
    if (!this.hasDescriptionTarget) return
    const text = (story.description || "").trim()
    if (text.length > 0) {
      this.descriptionTarget.textContent = text
      this.descriptionTarget.classList.remove("hidden")
    } else {
      this.descriptionTarget.textContent = ""
      this.descriptionTarget.classList.add("hidden")
    }
  }

  _renderReply(user) {
    if (!this.hasReplyFormTarget || !this.hasReplyInputTarget) return
    this._replyUserId = user.id
    const canReply = Boolean(user.can_reply)
    this.replyInputTarget.value = ""
    this.replyInputTarget.disabled = !canReply
    this.replyFormTarget.classList.toggle("opacity-60", !canReply)
    this.replyFormTarget.classList.toggle("pointer-events-none", !canReply)
    this.replyInputTarget.placeholder = canReply
      ? `Responder a ${user.username}...`
      : "Solo amigos pueden responder"
    if (this.hasReplyIndicatorTarget) {
      this.replyIndicatorTarget.classList.add("opacity-0", "scale-75")
      this.replyIndicatorTarget.classList.remove("opacity-100", "scale-100")
    }
    if (this.hasMessagesPathTemplateValue && this.messagesPathTemplateValue) {
      this.replyFormTarget.action = this._messagePathFor(user.id)
    }
    if (this.hasReplyStoryIdTarget) {
      this.replyStoryIdTarget.value = this._currentStoryId || ""
    }
  }

  _renderProgress(group, activeIndex) {
    this.progressTarget.innerHTML = ""
    this._progressBars = group.stories.map(() => {
      const wrap = document.createElement("div")
      wrap.className = "h-1 flex-1 rounded-full bg-white/20 overflow-hidden"
      const bar = document.createElement("div")
      bar.className = "h-full w-0 bg-white/90"
      wrap.appendChild(bar)
      this.progressTarget.appendChild(wrap)
      return bar
    })

    this._progressBars.forEach((bar, idx) => {
      if (idx < activeIndex) {
        bar.style.transition = "none"
        bar.style.width = "100%"
      } else if (idx > activeIndex) {
        bar.style.transition = "none"
        bar.style.width = "0%"
      }
    })
  }

  _renderMedia(story) {
    this._clearTimer()
    this._stopVideo()
    this._paused = false

    if (story.media_type === "video") {
      this.imageTarget.classList.add("hidden")
      this.videoTarget.classList.remove("hidden")
      this.videoTarget.src = story.media_url
      this.videoTarget.currentTime = 0
      this.videoTarget.muted = this._muted
      this._setSoundButtonState(true)
      this.videoTarget.play().catch(() => {})

      this.videoTarget.onloadedmetadata = () => {
        const duration = Math.max(this.videoTarget.duration || 0, 0.5) * 1000
        this._startTimer(duration)
      }
      this.videoTarget.onended = () => this.next()
      return
    }

    this.videoTarget.classList.add("hidden")
    this.imageTarget.classList.remove("hidden")
    this.imageTarget.src = story.media_url
    this._setSoundButtonState(false)
    this._startTimer(this.imageDurationValue || 5000)
  }

  _startTimer(durationMs) {
    this._timerRemainingMs = durationMs
    this._timerStartedAt = Date.now()
    const bar = this._progressBars?.[this._currentStoryIndex]
    if (bar) {
      bar.style.transition = "none"
      bar.style.width = "0%"
      requestAnimationFrame(() => {
        bar.style.transition = `width ${durationMs}ms linear`
        bar.style.width = "100%"
      })
    }

    this._timer = window.setTimeout(() => this.next(), durationMs)
  }

  _clearTimer() {
    if (this._timer) {
      window.clearTimeout(this._timer)
      this._timer = null
    }
    this._timerStartedAt = null
    this._timerRemainingMs = null
  }

  _stopVideo() {
    this.videoTarget.onended = null
    this.videoTarget.onloadedmetadata = null
    this.videoTarget.pause()
  }

  _currentGroup() {
    return this.storiesValue?.[this._currentUserIndex]
  }

  _loadViewed() {
    const key = this._viewedStorageKey()
    const raw = window.localStorage.getItem(key)
    try {
      const parsed = raw ? JSON.parse(raw) : []
      this._viewedIds = new Set(parsed.map((id) => Number(id)))
    } catch (e) {
      this._viewedIds = new Set()
    }
  }

  _saveViewed() {
    const key = this._viewedStorageKey()
    window.localStorage.setItem(key, JSON.stringify(Array.from(this._viewedIds)))
  }

  _viewedStorageKey() {
    const currentId = this.currentUserIdValue || "anon"
    return `stories_viewed_${currentId}`
  }

  _markViewed(userId) {
    if (!userId) return
    if (this._viewedIds.has(userId)) return
    this._viewedIds.add(userId)
    this._saveViewed()
    this._applyViewedState()
  }

  _applyViewedState() {
    const unseenClasses = ["from-fuchsia-500", "via-rose-500", "to-amber-400"]
    const seenClasses = ["from-zinc-600", "via-zinc-500", "to-zinc-400"]
    this._storyButtons().forEach((btn) => {
      const userId = Number(btn.dataset.storyUserId)
      const ring = btn.querySelector("[data-story-ring]")
      if (!ring) return
      const isSeen = this._viewedIds.has(userId)
      unseenClasses.forEach((c) => ring.classList.remove(c))
      seenClasses.forEach((c) => ring.classList.remove(c))
      if (isSeen) {
        seenClasses.forEach((c) => ring.classList.add(c))
      } else {
        unseenClasses.forEach((c) => ring.classList.add(c))
      }
    })
  }

  _applyOrdering() {
    if (!this.hasListTarget) return
    const unseen = []
    const seen = []
    this.storiesValue.forEach((group) => {
      if (this._viewedIds.has(group.user.id)) {
        seen.push(group)
      } else {
        unseen.push(group)
      }
    })
    const ordered = unseen.concat(seen)
    this.storiesValue = ordered
    ordered.forEach((group) => {
      const btn = this.listTarget.querySelector(`[data-story-user-id="${group.user.id}"]`)
      if (btn) this.listTarget.appendChild(btn)
    })
  }

  _storyButtons() {
    if (!this.hasListTarget) return []
    return Array.from(this.listTarget.querySelectorAll("[data-story-user-id]"))
  }

  _indexForUserId(userId) {
    if (!userId) return null
    return this.storiesValue.findIndex((group) => group.user.id === userId)
  }

  _indexForStoryId(storyId) {
    if (!storyId) return null
    const id = Number(storyId)
    for (let i = 0; i < this.storiesValue.length; i += 1) {
      const group = this.storiesValue[i]
      const idx = group.stories.findIndex((story) => Number(story.id) === id)
      if (idx >= 0) return { userIndex: i, storyIndex: idx }
    }
    return null
  }

  _openToStoryId(storyId) {
    const indices = this._indexForStoryId(storyId)
    if (!indices) return
    this._muted = false
    this._show(indices.userIndex, indices.storyIndex)
    this.modalTarget.classList.remove("hidden")
    document.addEventListener("keydown", this._onKeydown)
  }

  toggleSound() {
    if (this.videoTarget.classList.contains("hidden")) return
    this._muted = !this._muted
    this.videoTarget.muted = this._muted
    this._setSoundButtonState(true)
  }

  _setSoundButtonState(isVideo) {
    if (!this.hasSoundToggleTarget) return
    this.soundToggleTarget.disabled = !isVideo
    this.soundToggleTarget.textContent = this._muted ? "🔇" : "🔊"
    this.soundToggleTarget.classList.toggle("opacity-40", !isVideo)
    this.soundToggleTarget.classList.toggle("cursor-not-allowed", !isVideo)
    this.soundToggleTarget.classList.toggle("hidden", !isVideo)
  }

  togglePause() {
    if (this._paused) {
      this._resumePlayback()
    } else {
      this._pausePlayback()
    }
  }

  _pausePlayback() {
    if (this._paused) return
    this._paused = true
    this._pauseTimer()
    if (!this.videoTarget.classList.contains("hidden")) {
      this.videoTarget.pause()
    }
    this._setPauseButtonState()
  }

  _resumePlayback() {
    if (!this._paused) return
    this._paused = false
    this._resumeTimer()
    if (!this.videoTarget.classList.contains("hidden")) {
      this.videoTarget.play().catch(() => {})
    }
    this._setPauseButtonState()
  }

  _pauseTimer() {
    if (!this._timer) return
    if (this._timerStartedAt) {
      const elapsed = Date.now() - this._timerStartedAt
      this._timerRemainingMs = Math.max(0, (this._timerRemainingMs || 0) - elapsed)
    }
    window.clearTimeout(this._timer)
    this._timer = null

    const bar = this._progressBars?.[this._currentStoryIndex]
    if (bar) {
      const computed = window.getComputedStyle(bar).width
      bar.style.transition = "none"
      bar.style.width = computed
    }
  }

  _resumeTimer() {
    if (!this._timerRemainingMs || this._timerRemainingMs <= 0) return this.next()
    const bar = this._progressBars?.[this._currentStoryIndex]
    if (bar) {
      requestAnimationFrame(() => {
        bar.style.transition = `width ${this._timerRemainingMs}ms linear`
        bar.style.width = "100%"
      })
    }
    this._timerStartedAt = Date.now()
    this._timer = window.setTimeout(() => this.next(), this._timerRemainingMs)
  }

  _setPauseButtonState() {
    if (!this.hasPauseToggleTarget) return
    this.pauseToggleTarget.textContent = this._paused ? "▶" : "⏸"
  }

  _timeAgo(iso) {
    const created = new Date(iso)
    const diff = Math.max(0, Date.now() - created.getTime())
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `hace ${seconds}s`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `hace ${minutes}m`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `hace ${hours}h`
    const days = Math.floor(hours / 24)
    return `hace ${days}d`
  }

  submitReply(event) {
    if (!this.hasReplyInputTarget || !this.hasReplyFormTarget) return
    event.preventDefault()
    if (this.replyInputTarget.disabled) return
    const body = this.replyInputTarget.value.trim()
    if (!body) return

    const formData = new FormData(this.replyFormTarget)
    formData.set("message[body]", body)
    if (this._currentStoryId) {
      formData.set("story_id", String(this._currentStoryId))
    }

    fetch(this.replyFormTarget.action, {
      method: "POST",
      headers: {
        Accept: "text/vnd.turbo-stream.html",
        "X-CSRF-Token": this._csrfToken()
      },
      body: formData,
      credentials: "same-origin"
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        this.replyInputTarget.value = ""
        this._showReplyIndicator()
      })
      .catch(() => {
        this._showReplyIndicator(true)
      })
  }

  _showReplyIndicator(isError = false) {
    if (!this.hasReplyIndicatorTarget) return
    this.replyIndicatorTarget.classList.remove("opacity-0", "scale-75")
    this.replyIndicatorTarget.classList.add("opacity-100", "scale-100")
    this.replyIndicatorTarget.classList.toggle("bg-rose-500/80", isError)
    this.replyIndicatorTarget.classList.toggle("bg-emerald-400/80", !isError)
    window.clearTimeout(this._replyNoticeTimer)
    this._replyNoticeTimer = window.setTimeout(() => {
      this.replyIndicatorTarget.classList.add("opacity-0", "scale-75")
      this.replyIndicatorTarget.classList.remove("opacity-100", "scale-100")
    }, 1200)
  }

  _messagePathFor(userId) {
    if (!this.hasMessagesPathTemplateValue) return `/messages/${userId}`
    return this.messagesPathTemplateValue.replace("USER_ID", String(userId))
  }

  _storyLikePathFor(storyId) {
    if (!this.hasStoryLikePathTemplateValue) return `/stories/${storyId}/like`
    return this.storyLikePathTemplateValue.replace("STORY_ID", String(storyId))
  }

  _csrfToken() {
    const meta = document.querySelector("meta[name='csrf-token']")
    return meta?.content || ""
  }

  toggleLike() {
    if (!this.hasLikeButtonTarget || !this._currentStoryId) return
    const storyId = this._currentStoryId
    const liked = this.likeButtonTarget.dataset.liked === "true"
    const method = liked ? "DELETE" : "POST"
    const nextLiked = !liked
    this._likedOverrides.set(Number(storyId), nextLiked)
    this._renderLike({ id: storyId, liked: nextLiked })
    fetch(this._storyLikePathFor(storyId), {
      method,
      headers: {
        Accept: "application/json",
        "X-CSRF-Token": this._csrfToken()
      },
      credentials: "same-origin"
    })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        this._syncStoryLikeState(storyId, nextLiked)
      })
      .catch(() => {
        this._likedOverrides.delete(Number(storyId))
        this._renderLike(this._findStoryById(storyId) || { id: storyId, liked })
      })
  }

  _syncStoryLikeState(storyId, liked) {
    this.storiesValue.forEach((group) => {
      const story = group.stories?.find((item) => Number(item.id) === Number(storyId))
      if (story) story.liked = liked
    })
  }

  _findStoryById(storyId) {
    for (const group of this.storiesValue || []) {
      const story = group.stories?.find((item) => Number(item.id) === Number(storyId))
      if (story) return story
    }
    return null
  }
}


