import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["post", "panel"]
  static values = { open: Boolean }

  connect() {
    this.openValue = false
    this.apply()
  }

  toggle() {
    this.openValue = !this.openValue
    this.apply()
  }

  apply() {
    if (this.openValue) {
  this.postTarget.classList.add("lg:-translate-x-[170px]")

  this.panelTarget.classList.remove("lg:w-0", "lg:opacity-0", "lg:border-transparent", "pointer-events-none")
  this.panelTarget.classList.add("lg:w-[360px]", "lg:opacity-100", "lg:border-white/10", "pointer-events-auto")
} else {
  this.postTarget.classList.remove("lg:-translate-x-[170px]")

  this.panelTarget.classList.add("lg:w-0", "lg:opacity-0", "lg:border-transparent", "pointer-events-none")
  this.panelTarget.classList.remove("lg:w-[360px]", "lg:opacity-100", "lg:border-white/10", "pointer-events-auto")
}

  }
}

  