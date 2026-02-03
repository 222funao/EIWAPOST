import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tabPosts", "tabLiked", "panelPosts", "panelLiked"]

  showPosts() {
    this._activateTab("posts")
    this._transition(this.panelLikedTarget, this.panelPostsTarget)
  }

  showLiked() {
    this._activateTab("liked")
    this._transition(this.panelPostsTarget, this.panelLikedTarget)
  }

  _activateTab(which) {
    const active = "text-zinc-200"
    const inactive = "text-zinc-500"

    if (which === "posts") {
      this.tabPostsTarget.classList.add(active)
      this.tabPostsTarget.classList.remove(inactive)

      this.tabLikedTarget.classList.add(inactive)
      this.tabLikedTarget.classList.remove(active)
    } else {
      this.tabLikedTarget.classList.add(active)
      this.tabLikedTarget.classList.remove(inactive)

      this.tabPostsTarget.classList.add(inactive)
      this.tabPostsTarget.classList.remove(active)
    }
  }

  _transition(fromEl, toEl) {
    if (fromEl === toEl) return

    // Hide current panel immediately to avoid flicker
    fromEl.classList.add("hidden")
    fromEl.classList.remove("opacity-100")

    // Show new panel with a subtle fade-in
    toEl.classList.remove("hidden")
    toEl.classList.add("opacity-0")
    void toEl.offsetWidth
    toEl.classList.remove("opacity-0")
    toEl.classList.add("opacity-100")
  }
}
