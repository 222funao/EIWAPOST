import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "image", "video", "progress", "username", "avatar", "time", "soundToggle", "list"]
  static values = { stories: Array, imageDuration: Number, currentUserId: Number }

  connect() {
    this._timer = null
    this._currentUserIndex = 0
    this._currentStoryIndex = 0
    this._muted = false
    this._viewedIds = new Set()
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close()
      if (e.key === "ArrowRight") this.next()
      if (e.key === "ArrowLeft") this.prev()
    }

    this._loadViewed()
    this._applyViewedState()
    this._applyOrdering()
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
    this._renderHeader(group.user, story)
    this._renderProgress(group, storyIndex)
    this._renderMedia(story)
    this._markViewed(group.user.id)
  }

  _renderHeader(user, story) {
    this.usernameTarget.textContent = user.username
    this.avatarTarget.src = user.avatar_url
    this.timeTarget.textContent = this._timeAgo(story.created_at)
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
  }

  _timeAgo(iso) {
    const created = new Date(iso)
    const diff = Math.max(0, Date.now() - created.getTime())
    const seconds = Math.floor(diff / 1000)
    if (seconds < 60) return `${seconds}s back`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m back`
    const hours = Math.floor(minutes / 60)
    if (hours < 24) return `${hours}h back`
    const days = Math.floor(hours / 24)
    return `${days}d back`
  }
}
