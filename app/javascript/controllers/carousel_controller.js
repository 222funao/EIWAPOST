import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["track", "dot"]
  static values = { index: Number }

  connect() {
    if (isNaN(this.indexValue)) this.indexValue = 0
    this.update({ instant: true }) // al cargar, sin animación rara
    window.addEventListener("resize", this._onResize)
  }

  disconnect() {
    window.removeEventListener("resize", this._onResize)
  }

  _onResize = () => {
    // Re-ajusta posición al cambiar tamaño
    this.update({ instant: true })
  }

  next() {
    const total = this.slideCount()
    const wasLast = this.indexValue === total - 1
    this.indexValue = (this.indexValue + 1) % total
    this.update({ instant: wasLast }) // si envuelve, salto instantáneo
  }

  prev() {
    const total = this.slideCount()
    const wasFirst = this.indexValue === 0
    this.indexValue = (this.indexValue - 1 + total) % total
    this.update({ instant: wasFirst }) // si envuelve, salto instantáneo
  }

  go(event) {
    this.indexValue = Number(event.params.index)
    this.update({ instant: false })
  }

  update(opts = {}) {
    const { instant = false } = opts
    const width = this.trackTarget.clientWidth

    // 1) Marcar slide activo con true/false (para tu observer)
    Array.from(this.trackTarget.children).forEach((child, i) => {
      child.setAttribute("data-active", i === this.indexValue ? "true" : "false")
    })

    // 2) Pausar todos los videos ANTES de mover
    this.element.querySelectorAll("video[data-video]").forEach((v) => v.pause())

    // 3) Mover carrusel (instantáneo si envuelve)
    this.trackTarget.scrollTo({
      left: width * this.indexValue,
      behavior: instant ? "auto" : "smooth",
    })

    // 4) Dots
    if (this.hasDotTarget) {
      this.dotTargets.forEach((d, i) => {
        d.classList.toggle("opacity-100", i === this.indexValue)
        d.classList.toggle("opacity-40", i !== this.indexValue)
      })
    }

    // 5) Reproducir solo el video del slide activo
    const activeSlide = this.trackTarget.children[this.indexValue]
    const v = activeSlide?.querySelector("video[data-video]")
    if (v) v.play().catch(() => {})
  }

  slideCount() {
    return this.trackTarget.children.length
  }
}
