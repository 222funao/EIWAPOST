import { Controller } from "@hotwired/stimulus"
import { createConsumer } from "@rails/actioncable"

const consumer = createConsumer()

export default class extends Controller {
  static values = {
    userId: Number,
    heartbeatUrl: String,
    offlineUrl: String
  }

  connect() {
    if (!this.hasUserIdValue) return

    this.received = this.received.bind(this)
    this.handleBeforeUnload = this.handleBeforeUnload.bind(this)

    this.subscription = consumer.subscriptions.create(
      { channel: "PresenceChannel" },
      { received: this.received }
    )

    this.sendHeartbeat()
    this.heartbeatTimer = window.setInterval(() => this.sendHeartbeat(), 20_000)
    this.textTimer = window.setInterval(() => this.refreshRelativeTexts(), 60_000)
    window.addEventListener("beforeunload", this.handleBeforeUnload)
    this.refreshRelativeTexts()
  }

  disconnect() {
    if (this.subscription) consumer.subscriptions.remove(this.subscription)
    if (this.heartbeatTimer) window.clearInterval(this.heartbeatTimer)
    if (this.textTimer) window.clearInterval(this.textTimer)
    window.removeEventListener("beforeunload", this.handleBeforeUnload)
  }

  received(payload) {
    const userId = Number(payload.user_id)
    const online = Boolean(payload.online)
    const lastSeenAt = payload.last_seen_at || ""

    this.updateDots(userId, online)
    this.updateTexts(userId, online, lastSeenAt)
  }

  sendHeartbeat() {
    if (!this.hasHeartbeatUrlValue) return

    fetch(this.heartbeatUrlValue, {
      method: "POST",
      headers: {
        "X-CSRF-Token": this.csrfToken(),
        Accept: "application/json"
      },
      credentials: "same-origin"
    }).catch(() => {})
  }

  handleBeforeUnload() {
    if (!this.hasOfflineUrlValue) return
    navigator.sendBeacon(this.offlineUrlValue)
  }

  updateDots(userId, online) {
    document.querySelectorAll(`[data-presence-dot-for="${userId}"]`).forEach((dot) => {
      dot.classList.toggle("hidden", !online)
    })
  }

  updateTexts(userId, online, lastSeenAt) {
    document.querySelectorAll(`[data-presence-text-for="${userId}"]`).forEach((node) => {
      node.dataset.presenceOnline = online ? "true" : "false"
      node.dataset.presenceLastSeenAt = lastSeenAt
      node.textContent = online ? "En linea" : this.offlineText(lastSeenAt)
    })
  }

  refreshRelativeTexts() {
    document.querySelectorAll("[data-presence-text-for]").forEach((node) => {
      if (node.dataset.presenceOnline === "true") return
      node.textContent = this.offlineText(node.dataset.presenceLastSeenAt)
    })
  }

  offlineText(lastSeenAt) {
    if (!lastSeenAt) return "Activo recientemente"
    const date = new Date(lastSeenAt)
    if (Number.isNaN(date.getTime())) return "Activo recientemente"

    const diffSeconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
    if (diffSeconds < 60) return "Activo hace unos segundos"
    if (diffSeconds < 3600) return `Activo hace ${Math.floor(diffSeconds / 60)} min`
    if (diffSeconds < 86_400) return `Activo hace ${Math.floor(diffSeconds / 3600)} h`
    return `Activo hace ${Math.floor(diffSeconds / 86_400)} d`
  }

  csrfToken() {
    const token = document.querySelector("meta[name='csrf-token']")
    return token?.content || ""
  }
}
