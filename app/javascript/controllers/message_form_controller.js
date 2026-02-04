import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["fileInput", "notice"]

  filesChanged() {
    if (!this.hasFileInputTarget || !this.hasNoticeTarget) return

    const count = this.fileInputTarget.files.length
    if (count > 0) {
      this.noticeTarget.textContent = `${count} ${count === 1 ? "archivo listo" : "archivos listos"}`
      this.noticeTarget.classList.remove("hidden")
    } else {
      this.noticeTarget.classList.add("hidden")
    }
  }

  reset(event) {
    if (!event.detail.success) return

    const textarea = this.element.querySelector("textarea")
    if (textarea) textarea.value = ""

    if (this.hasFileInputTarget) this.fileInputTarget.value = ""
    if (this.hasNoticeTarget) this.noticeTarget.classList.add("hidden")

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
