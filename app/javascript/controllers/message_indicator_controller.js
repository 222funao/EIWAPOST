import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  clear() {
    const indicator = document.getElementById("messages_indicator")
    if (indicator) indicator.innerHTML = ""
  }
}
