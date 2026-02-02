import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tabPosts", "tabLiked", "panelPosts", "panelLiked"]

  showPosts() {
    this._activateTab("posts")
    this._transition(this.panelLikedTarget, this.panelPostsTarget)
  }

  showLiked() {
    this._activateTab("liked")
    this._transition(this.panelPostsTarget, this.panelLikedTarget)
  }

  _activateTab(which) {
    const active = "text-zinc-200"
    const inactive = "text-zinc-500"

    if (which === "posts") {
      this.tabPostsTarget.classList.add(active)
      this.tabPostsTarget.classList.remove(inactive)

      this.tabLikedTarget.classList.add(inactive)
      this.tabLikedTarget.classList.remove(active)
    } else {
      this.tabLikedTarget.classList.add(active)
      this.tabLikedTarget.classList.remove(inactive)

      this.tabPostsTarget.classList.add(inactive)
      this.tabPostsTarget.classList.remove(active)
    }
  }

  _transition(fromEl, toEl) {
    // 1) Preparar el panel que entra (ponerlo en su lugar pero invisible)
    toEl.classList.remove("absolute", "-left-[99999px]", "pointer-events-none")
    toEl.classList.add("opacity-0", "translate-x-2")

    // Forzar reflow para que el browser “registre” el estado inicial antes de animar
    void toEl.offsetWidth

    // 2) Animar salida del que estaba visible
    fromEl.classList.add("opacity-0", "translate-x-2", "pointer-events-none")

    // 3) Animar entrada del nuevo
    toEl.classList.remove("opacity-0", "translate-x-2")
    toEl.classList.add("opacity-100", "translate-x-0")

    // 4) Al terminar la animación, mandar el anterior fuera de pantalla para que no ocupe espacio
    window.clearTimeout(this._timer)
    this._timer = window.setTimeout(() => {
      fromEl.classList.remove("opacity-100", "translate-x-0")
      fromEl.classList.add("absolute", "-left-[99999px]")
    }, 320) // un poquito > 300ms por seguridad
  }
}
