import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal"]

  connect() {
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close()
    }
  }

  open() {
    this.modalTarget.classList.remove("hidden")
    document.addEventListener("keydown", this._onKeydown)
  }

  close() {
    this.modalTarget.classList.add("hidden")
    document.removeEventListener("keydown", this._onKeydown)
  }
}
