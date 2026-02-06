import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  open() {
    if (this.hasModalTarget) this.modalTarget.classList.remove("hidden")
  }

  close() {
    if (this.hasModalTarget) this.modalTarget.classList.add("hidden")
  }
}
