import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  connect() {
    this.container = this.element.closest(".messages-scroll")
    this.scheduleScroll()

    this.observer = new MutationObserver(() => {
      this.scheduleScroll()
    })
    this.observer.observe(this.element, { childList: true, subtree: false })
  }

  disconnect() {
    if (this.observer) this.observer.disconnect()
  }

  scheduleScroll() {
    if (!this.container) return
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        this.container.scrollTop = this.container.scrollHeight
      })
    })
  }
}
