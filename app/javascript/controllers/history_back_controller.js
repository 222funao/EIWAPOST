import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static values = { fallback: String }

  go(event) {
    event.preventDefault()

    if (this.canGoBack()) {
      window.history.back()
      return
    }

    if (this.hasFallbackValue && this.fallbackValue) {
      window.location.href = this.fallbackValue
      return
    }

    window.location.href = "/"
  }

  canGoBack() {
    if (window.history.length <= 1) return false
    if (!document.referrer) return false

    try {
      const referrerUrl = new URL(document.referrer)
      return referrerUrl.origin === window.location.origin
    } catch (_error) {
      return false
    }
  }
}
