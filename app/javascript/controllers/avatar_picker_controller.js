import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input"]

  pick() {
    this.inputTarget.click()
  }

  submit() {
    this.element.querySelector("form").requestSubmit()
  }
}
