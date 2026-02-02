/** Lógica de Autoplay con Intersection Observer */
let observer = null

const isVideoInActiveCarouselSlide = (video) => {
  // Si no está dentro de un carrusel, lo tratamos normal
  const carousel = video.closest('[data-controller="carousel"]')
  if (!carousel) return true

  // Si está dentro de carrusel: solo si el slide contenedor es el activo
  const slide = video.closest("[data-slide]")
  if (!slide) return false

  return slide.getAttribute("data-active") === "true"
}

const startVideoObserver = () => {
  // Evitar duplicar observers en Turbo
  if (observer) observer.disconnect()

  observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      const video = entry.target

      if (entry.isIntersecting) {
        // Si está en carrusel pero NO es el slide activo, no reproducir
        if (!isVideoInActiveCarouselSlide(video)) return

        video.play().catch(() => {})
      } else {
        video.pause()
      }
    })
  }, { threshold: 0.6 })

  document.querySelectorAll("video[data-video]").forEach((v) => observer.observe(v))
}

/** Delegación de Eventos */
document.addEventListener("click", (e) => {
  // Play/Pause al click en el video
  if (e.target.matches("video[data-video]")) {
    const video = e.target
    video.paused ? video.play().catch(() => {}) : video.pause()
  }

  // Botón mute
  const muteBtn = e.target.closest(".mute-btn")
  if (muteBtn) {
    const videoWrapper = muteBtn.closest(".video-wrapper")
    const video = videoWrapper ? videoWrapper.querySelector("video[data-video]") : null
    if (video) {
      e.stopPropagation()
      video.muted = !video.muted
      muteBtn.textContent = video.muted ? "🔇" : "🔊"
    }
  }
})

const initVideos = () => {
  startVideoObserver()
  document.querySelectorAll("video[data-video]").forEach(v => (v.style.cursor = "pointer"))
}

// Turbo events
document.addEventListener("turbo:load", initVideos)
document.addEventListener("turbo:render", initVideos)
// fallback si entras sin turbo
document.addEventListener("DOMContentLoaded", initVideos)
