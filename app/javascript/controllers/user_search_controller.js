import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["modal", "input", "results"]
  static values = { postsUrl: String }

  connect() {
    this._onKeydown = (e) => {
      if (e.key === "Escape") this.close()
    }
    this._debounceTimer = null
  }

  open() {
    this.modalTarget.classList.remove("hidden")
    document.addEventListener("keydown", this._onKeydown)
    setTimeout(() => this.inputTarget.focus(), 0)
  }

  close() {
    this.modalTarget.classList.add("hidden")
    document.removeEventListener("keydown", this._onKeydown)
  }

  clear() {
    this.inputTarget.value = ""
    this.renderEmpty()
    this.inputTarget.focus()
  }

  // se llama con keyup (y opcionalmente enter)
  search(event) {
    if (event?.type === "keydown" && event.key === "Enter") event.preventDefault()

    const q = this.inputTarget.value.trim()
    clearTimeout(this._debounceTimer)

    this._debounceTimer = setTimeout(() => {
      this.fetchResults(q)
    }, 200)
  }

  filterPosts(event) {
    if (event?.type === "keydown" && event.key === "Enter") event.preventDefault()
    if (!this.hasPostsUrlValue) return

    const q = this.inputTarget.value.trim()
    const url = new URL(this.postsUrlValue, window.location.origin)

    if (q) {
      url.searchParams.set("q", q)
    } else {
      url.searchParams.delete("q")
    }

    window.location.href = url.toString()
  }

  async fetchResults(q) {
    if (!q) {
      this.renderEmpty()
      return
    }

    this.resultsTarget.innerHTML = `
      <div class="py-6 text-center text-sm text-zinc-500">Buscando...</div>
    `

    try {
      const res = await fetch(`/search/users?q=${encodeURIComponent(q)}`, {
        headers: { Accept: "application/json" }
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const users = await res.json()
      this.renderUsers(users)
    } catch (e) {
      this.resultsTarget.innerHTML = `
        <div class="py-6 text-center text-sm text-rose-300">
          Error al buscar usuarios.
        </div>
      `
      // eslint-disable-next-line no-console
      console.error(e)
    }
  }

  renderEmpty() {
    this.resultsTarget.innerHTML = `
      <div class="py-10 text-center text-sm text-zinc-500">
        No hay búsquedas recientes.
      </div>
    `
  }

  renderUsers(users) {
    if (!users.length) {
      this.resultsTarget.innerHTML = `
        <div class="py-10 text-center text-sm text-zinc-500">
          No se encontraron usuarios.
        </div>
      `
      return
    }

    this.resultsTarget.innerHTML = users
      .map((u) => {
        const followed = !!u.followed
        const followsYou = !!u.follows_you
        const friends = followed && followsYou
        const label = friends
          ? "Amigos"
          : followed
            ? "Siguiendo"
            : followsYou
              ? "Seguir también"
              : "Seguir"
        const btnClass = friends
          ? "shrink-0 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
          : followed
            ? "shrink-0 rounded-lg bg-zinc-700/40 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700/55"
            : "shrink-0 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"

        return `
          <div class="flex items-center justify-between gap-3 rounded-xl px-3 py-2 hover:bg-white/5">
            <!-- Link SOLO en la parte izquierda (para que el botón no navegue) -->
            <a href="${u.profile_url}" class="flex items-center gap-3 min-w-0">
              <img src="${u.avatar_url}" class="h-9 w-9 rounded-full object-cover ring-1 ring-white/10" />
              <div class="min-w-0">
                <div class="text-sm font-semibold text-zinc-100 truncate">${this.escape(u.username)}</div>
              </div>
            </a>

            <button
              type="button"
              data-user-id="${u.id}"
              data-followed="${followed ? "1" : "0"}"
              data-follows-you="${followsYou ? "1" : "0"}"
              data-action="click->user-search#toggleFollow"
              class="${btnClass}">
              ${label}
            </button>
          </div>
        `
      })
      .join("")
  }

  async toggleFollow(e) {
    e.preventDefault()
    e.stopPropagation()

    const btn = e.currentTarget
    const userId = btn.dataset.userId
    const token = document.querySelector("meta[name='csrf-token']")?.content

    const currentlyFollowed = btn.dataset.followed === "1"
    const method = currentlyFollowed ? "DELETE" : "POST"

    try {
      const res = await fetch(`/users/${userId}/follow`, {
        method,
        headers: {
          "X-CSRF-Token": token,
          Accept: "application/json",
          "X-Requested-With": "XMLHttpRequest"
        }
      })

      if (!res.ok) throw new Error(`HTTP ${res.status}`)

      const contentType = res.headers.get("content-type") || ""
      if (!contentType.includes("application/json")) {
        await this.fetchResults(this.inputTarget.value.trim())
        return
      }

      const data = await res.json()
      const followed = !!data.followed
      const followsYou = !!data.follows_you
      const friends = !!data.friends

      btn.dataset.followed = followed ? "1" : "0"
      btn.dataset.followsYou = followsYou ? "1" : "0"

      btn.textContent = friends
        ? "Amigos"
        : followed
          ? "Siguiendo"
          : followsYou
            ? "Seguir también"
            : "Seguir"

      // reset clases
      btn.className = friends
        ? "shrink-0 rounded-lg bg-emerald-500/15 px-3 py-1.5 text-xs font-semibold text-emerald-200 hover:bg-emerald-500/25"
        : followed
          ? "shrink-0 rounded-lg bg-zinc-700/40 px-3 py-1.5 text-xs font-semibold text-zinc-100 hover:bg-zinc-700/55"
          : "shrink-0 rounded-lg bg-sky-500/15 px-3 py-1.5 text-xs font-semibold text-sky-300 hover:bg-sky-500/25"
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error(err)
    }
  }

  escape(str) {
    return String(str).replace(/[&<>"']/g, (m) => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    }[m]))
  }
}
