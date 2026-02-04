import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "image", "video"]

  open(event) {
    const { url, type } = event.currentTarget.dataset
    if (!url || !type) return

    if (type === "video") {
      this.imageTarget.classList.add("hidden")
      this.videoTarget.classList.remove("hidden")
      this.videoTarget.src = url
      this.videoTarget.currentTime = 0
      this.videoTarget.muted = false
      this.videoTarget.play().catch(() => {})
    } else {
      this.videoTarget.pause()
      this.videoTarget.removeAttribute("src")
      this.videoTarget.load()
      this.videoTarget.classList.add("hidden")
      this.imageTarget.classList.remove("hidden")
      this.imageTarget.src = url
    }

    this.modalTarget.classList.remove("hidden")
    document.body.classList.add("overflow-hidden")
    this.modalTarget.focus()
  }

  close() {
    this.modalTarget.classList.add("hidden")
    this.imageTarget.classList.add("hidden")
    this.imageTarget.removeAttribute("src")
    this.videoTarget.classList.add("hidden")
    this.videoTarget.pause()
    this.videoTarget.removeAttribute("src")
    this.videoTarget.load()
    document.body.classList.remove("overflow-hidden")
  }

  closeOnBackdrop(event) {
    if (event.target === this.modalTarget) {
      this.close()
    }
  }

  ignore(event) {
    event.stopPropagation()
  }
}
