import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["button", "panel", "list", "ping"]

  connect() {
    this._open = false
    this._lastId = this._currentTopId()
    this._dragging = false
    this._offset = { x: 0, y: 0 }
    this._dragMoved = false
    this._dragStart = { x: 0, y: 0 }
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
    if (this._dragMoved) {
      this._dragMoved = false
      return
    }
    this._open ? this._closePanel() : this._openPanel()
  }

  startDrag(event) {
    if (event.button !== 0) return
    this._dragging = true
    this._dragMoved = false
    this._dragStart = { x: event.clientX, y: event.clientY }
    const rect = this.element.getBoundingClientRect()
    this._offset = {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top
    }
    this.element.classList.add("select-none")
    this.element.setPointerCapture(event.pointerId)
  }

  drag(event) {
    if (!this._dragging) return
    const deltaX = Math.abs(event.clientX - this._dragStart.x)
    const deltaY = Math.abs(event.clientY - this._dragStart.y)
    if (deltaX + deltaY < 6) return
    this._dragMoved = true
    const x = event.clientX - this._offset.x
    const y = event.clientY - this._offset.y
    this.element.style.left = `${Math.max(8, x)}px`
    this.element.style.top = `${Math.max(8, y)}px`
    this.element.style.right = "auto"
    this.element.style.bottom = "auto"
  }

  endDrag(event) {
    if (!this._dragging) return
    this._dragging = false
    this.element.classList.remove("select-none")
    this.element.releasePointerCapture(event.pointerId)
    if (!this._dragMoved) {
      this.toggle()
    }
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
