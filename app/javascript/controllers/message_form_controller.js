import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  reset(event) {
    if (!event.detail.success) return

    const textarea = this.element.querySelector("textarea")
    if (textarea) textarea.value = ""

    const fileInput = this.element.querySelector("input[type='file']")
    if (fileInput) fileInput.value = ""

    const list = document.getElementById("messages_list")
    if (list) {
      const container = list.closest(".messages-scroll")
      if (container) {
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            container.scrollTop = container.scrollHeight
          })
        })
      }
    }
  }
}
