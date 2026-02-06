import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "stepSelect", "stepDetails", "count", "nextButton"]

  connect() {
    this.updateCount()
  }

  open() {
    this.modalTarget.classList.remove("hidden")
    this.showSelect()
    this.updateCount()
  }

  close() {
    this.modalTarget.classList.add("hidden")
  }

  next() {
    if (this.selectedCount() === 0) return
    this.showDetails()
  }

  back() {
    this.showSelect()
  }

  reset() {
    this.showSelect()
    this.clearSelections()
    this.close()
  }

  toggleSelection() {
    this.updateCount()
  }

  showSelect() {
    if (this.hasStepSelectTarget) this.stepSelectTarget.classList.remove("hidden")
    if (this.hasStepDetailsTarget) this.stepDetailsTarget.classList.add("hidden")
  }

  showDetails() {
    if (this.hasStepSelectTarget) this.stepSelectTarget.classList.add("hidden")
    if (this.hasStepDetailsTarget) this.stepDetailsTarget.classList.remove("hidden")
  }

  updateCount() {
    if (!this.hasCountTarget) return
    const count = this.selectedCount()
    this.countTarget.textContent = count
    if (this.hasNextButtonTarget) {
      const disabled = count === 0
      this.nextButtonTarget.disabled = disabled
      this.nextButtonTarget.classList.toggle("opacity-50", disabled)
      this.nextButtonTarget.classList.toggle("cursor-not-allowed", disabled)
    }
  }

  selectedCount() {
    return this.checkboxes().filter((checkbox) => checkbox.checked).length
  }

  clearSelections() {
    this.checkboxes().forEach((checkbox) => {
      checkbox.checked = false
    })
    this.updateCount()
  }

  checkboxes() {
    return Array.from(this.element.querySelectorAll("input[type='checkbox'][name='group[member_ids][]']"))
  }
}
