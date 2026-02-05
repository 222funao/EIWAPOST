import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "panel", "list", "ping"]

  connect() {
    this._open = false
    this._lastId = this._currentTopId()
    this._observer = new MutationObserver(() => this._handleListChange())
    if (this.hasListTarget) {
      this._observer.observe(this.listTarget, { childList: true, subtree: false })
    }
  }

  disconnect() {
    if (this._observer) this._observer.disconnect()
    window.clearTimeout(this._autoCloseTimer)
    window.clearTimeout(this._pingTimer)
  }

  toggle() {
    this._open ? this._closePanel() : this._openPanel()
  }

  _handleListChange() {
    const id = this._currentTopId()
    if (!id || id === this._lastId) return
    this._lastId = id
    this._flashPing()
    this._trimToFive()
  }

  _currentTopId() {
    const first = this.listTarget?.querySelector("[data-notification-id]")
    return first ? Number(first.dataset.notificationId) : null
  }

  _flashPing() {
    if (!this.hasPingTarget) return
    this.pingTarget.classList.remove("opacity-0")
    this.pingTarget.classList.add("animate-pulse")
  }

  _openPanel() {
    this._open = true
    this.panelTarget.classList.remove("opacity-0", "translate-y-2", "pointer-events-none")
    this.panelTarget.classList.add("opacity-100", "translate-y-0", "pointer-events-auto")
    if (this.hasPingTarget) {
      this.pingTarget.classList.add("opacity-0")
      this.pingTarget.classList.remove("animate-pulse")
    }
  }

  _closePanel() {
    this._open = false
    this.panelTarget.classList.add("opacity-0", "translate-y-2", "pointer-events-none")
    this.panelTarget.classList.remove("opacity-100", "translate-y-0", "pointer-events-auto")
  }

  _trimToFive() {
    if (!this.hasListTarget) return
    const items = Array.from(this.listTarget.querySelectorAll("[data-notification-id]"))
    if (items.length <= 5) return
    items.slice(5).forEach((node) => node.remove())
  }
}
