import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["audio", "playButton", "progressFill", "currentTime", "duration", "status"]

  connect() {
    if (!this.hasAudioTarget) return

    this.audioTarget.addEventListener("timeupdate", () => this.updateProgress())
    this.audioTarget.addEventListener("loadedmetadata", () => this.updateDuration())
    this.audioTarget.addEventListener("ended", () => this.onEnded())
    this.audioTarget.addEventListener("play", () => this.updatePlayState(true))
    this.audioTarget.addEventListener("pause", () => this.updatePlayState(false))

    const type = this.audioTarget.dataset.type
    if (type && !this.audioTarget.canPlayType(type)) {
      this.disablePlayer("Formato de audio no compatible")
      return
    }

    this.updateProgress()
    this.updateDuration()
  }

  toggle() {
    if (!this.hasAudioTarget || this.audioTarget.disabled) return

    if (this.audioTarget.paused) {
      this.audioTarget.play()
    } else {
      this.audioTarget.pause()
    }
  }

  seek(event) {
    if (!this.hasAudioTarget || this.audioTarget.disabled) return
    const rect = event.currentTarget.getBoundingClientRect()
    const ratio = (event.clientX - rect.left) / rect.width
    const time = Math.max(0, Math.min(1, ratio)) * (this.audioTarget.duration || 0)
    this.audioTarget.currentTime = time
  }

  updateProgress() {
    if (!this.hasProgressFillTarget) return
    const duration = this.audioTarget.duration || 0
    const current = this.audioTarget.currentTime || 0
    const percent = duration > 0 ? (current / duration) * 100 : 0
    this.progressFillTarget.style.width = `${percent}%`
    this.updateCurrentTime()
  }

  updateDuration() {
    if (!this.hasDurationTarget) return
    const duration = this.audioTarget.duration || 0
    this.durationTarget.textContent = this.formatTime(duration)
  }

  updateCurrentTime() {
    if (!this.hasCurrentTimeTarget) return
    const current = this.audioTarget.currentTime || 0
    this.currentTimeTarget.textContent = this.formatTime(current)
  }

  updatePlayState(isPlaying) {
    if (!this.hasPlayButtonTarget) return
    this.playButtonTarget.textContent = isPlaying ? "Pausa" : "Play"
    this.playButtonTarget.setAttribute("aria-pressed", isPlaying ? "true" : "false")
  }

  onEnded() {
    this.updatePlayState(false)
  }

  disablePlayer(message) {
    if (this.hasPlayButtonTarget) {
      this.playButtonTarget.disabled = true
      this.playButtonTarget.classList.add("cursor-not-allowed", "opacity-60")
      this.playButtonTarget.textContent = "No"
    }
    if (this.hasStatusTarget) {
      this.statusTarget.textContent = message
      this.statusTarget.classList.remove("hidden")
    }
  }

  formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00"
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }
}
