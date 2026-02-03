import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  toggle(event) {
    const video = event.currentTarget
    if (video.paused) {
      video.play()
    } else {
      video.pause()
    }
  }
}
