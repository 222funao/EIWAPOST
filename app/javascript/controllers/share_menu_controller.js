import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "closeButton", "form"]

  connect() {
    if (!this.hasModalTarget || !this.hasCloseButtonTarget) return

    this.restoreScrollFromSession()

    this.modalElement = this.modalTarget
    this.closeButtonElement = this.closeButtonTarget
    this.formElement = this.hasFormTarget ? this.formTarget : null

    this.originalParent = this.modalElement.parentNode
    this.placeholder = document.createComment("share-menu-modal-placeholder")
    this.originalParent.insertBefore(this.placeholder, this.modalElement)
    document.body.appendChild(this.modalElement)

    this.boundBackdropClose = this.closeOnBackdrop.bind(this)
    this.boundEscClose = (event) => {
      if (event.key === "Escape") this.close(event)
    }
    this.boundButtonClose = this.close.bind(this)
    this.boundSubmitRemember = this.rememberScroll.bind(this)
    this.boundSubmitEnd = this.handleSubmitEnd.bind(this)

    this.modalElement.addEventListener("click", this.boundBackdropClose)
    window.addEventListener("keydown", this.boundEscClose)
    this.closeButtonElement.addEventListener("click", this.boundButtonClose)
    if (this.formElement) {
      this.formElement.addEventListener("submit", this.boundSubmitRemember)
      this.formElement.addEventListener("turbo:submit-end", this.boundSubmitEnd)
    }
  }

  open(event) {
    event.preventDefault()
    if (!this.modalElement || !this.modalElement.classList.contains("hidden")) return

    this.savedScrollY = window.scrollY
    this.modalElement.classList.remove("hidden")
    this.lockBodyScroll()
  }

  close(event) {
    if (event) event.preventDefault()
    if (!this.modalElement || this.modalElement.classList.contains("hidden")) return

    this.modalElement.classList.add("hidden")
    this.unlockBodyScroll()
  }

  closeOnBackdrop(event) {
    if (event.target === this.modalElement) {
      this.close()
    }
  }

  handleSubmitEnd(event) {
    if (!event.detail.success) return

    if (this.formElement) this.formElement.reset()
    this.close()
  }

  disconnect() {
    if (!this.modalElement || !this.closeButtonElement) return

    this.modalElement.removeEventListener("click", this.boundBackdropClose)
    window.removeEventListener("keydown", this.boundEscClose)
    this.closeButtonElement.removeEventListener("click", this.boundButtonClose)
    if (this.formElement) {
      this.formElement.removeEventListener("submit", this.boundSubmitRemember)
      this.formElement.removeEventListener("turbo:submit-end", this.boundSubmitEnd)
    }
    this.unlockBodyScroll()

    if (this.placeholder?.parentNode) {
      this.placeholder.parentNode.insertBefore(this.modalElement, this.placeholder)
      this.placeholder.remove()
    }
  }

  lockBodyScroll() {
    document.body.classList.add("overflow-hidden")
    document.body.style.position = "fixed"
    document.body.style.top = `-${this.savedScrollY || 0}px`
    document.body.style.width = "100%"
  }

  unlockBodyScroll() {
    const scrollY = this.savedScrollY || 0
    document.body.classList.remove("overflow-hidden")
    document.body.style.position = ""
    document.body.style.top = ""
    document.body.style.width = ""
    window.scrollTo(0, scrollY)
  }

  rememberScroll() {
    const y = Number.isFinite(this.savedScrollY) ? this.savedScrollY : window.scrollY
    sessionStorage.setItem("shareMenuScrollY", String(y))
  }

  restoreScrollFromSession() {
    const raw = sessionStorage.getItem("shareMenuScrollY")
    if (!raw) return

    const y = parseInt(raw, 10)
    sessionStorage.removeItem("shareMenuScrollY")
    if (!Number.isNaN(y)) {
      window.requestAnimationFrame(() => window.scrollTo(0, y))
    }
  }
}
