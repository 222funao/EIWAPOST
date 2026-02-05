import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["followersModal", "followingModal"]

  openFollowers() {
    this._open(this.followersModalTarget)
  }

  openFollowing() {
    this._open(this.followingModalTarget)
  }

  closeFollowers() {
    this._close(this.followersModalTarget)
  }

  closeFollowing() {
    this._close(this.followingModalTarget)
  }

  _open(target) {
    target.classList.remove("hidden")
    target.querySelector("[data-modal-card]")?.classList.add("animate-in", "fade-in", "zoom-in-95")
  }

  _close(target) {
    target.classList.add("hidden")
  }
}
