import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["fileInput", "notice", "recordButton", "recordStatus"]

  connect() {
    this.mediaRecorder = null
    this.recordChunks = []
    this.stream = null
    this.isRecording = false
    this.hasMic = false

    this.checkMicAvailability()
  }

  disconnect() {
    this.stopRecording(true)
  }

  async checkMicAvailability() {
    if (typeof MediaRecorder === "undefined") {
      this.setMicUnavailable("Grabacion no disponible")
      return
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) {
      this.setMicUnavailable("Microfono no disponible")
      return
    }

    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      this.hasMic = devices.some((device) => device.kind === "audioinput")
      if (!this.hasMic) {
        this.setMicUnavailable("Sin microfono disponible")
      }
    } catch (error) {
      this.setMicUnavailable("Microfono no disponible")
    }
  }

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

  async toggleRecording() {
    if (!this.hasRecordButtonTarget) return
    if (this.recordButtonTarget.disabled) return

    if (this.isRecording) {
      this.stopRecording()
    } else {
      await this.startRecording()
    }
  }

  async startRecording() {
    if (typeof MediaRecorder === "undefined") {
      this.setMicUnavailable("Grabacion no disponible")
      return
    }
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      this.setMicUnavailable("Microfono no disponible")
      return
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true })
    } catch (error) {
      this.showRecordStatus("Permiso de microfono denegado")
      return
    }

    const { mimeType, extension } = this.pickAudioFormat()
    if (!mimeType) {
      this.setMicUnavailable("Grabacion no disponible")
      return
    }

    this.recordChunks = []
    this.mediaRecorder = new MediaRecorder(this.stream, { mimeType })
    this.mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) this.recordChunks.push(event.data)
    }
    this.mediaRecorder.onstop = () => this.handleRecordingStop()
    this.mediaRecorder.start()
    this.isRecording = true
    this.recordExtension = extension
    this.updateRecordUI()
  }

  stopRecording(silent = false) {
    if (this.mediaRecorder && this.mediaRecorder.state !== "inactive") {
      this.mediaRecorder.stop()
    } else if (!silent) {
      this.isRecording = false
      this.updateRecordUI()
    }
  }

  handleRecordingStop() {
    const mimeType = this.mediaRecorder?.mimeType || "audio/webm"
    const blob = new Blob(this.recordChunks, { type: mimeType })
    this.releaseStream()
    this.isRecording = false
    this.updateRecordUI()

    if (blob.size === 0) return
    const ext = this.recordExtension || "webm"
    const filename = `audio-${Date.now()}.${ext}`
    const file = new File([blob], filename, { type: mimeType })
    this.attachRecordedAudio(file)
    this.showRecordStatus("Grabacion de audio lista")
  }

  pickAudioFormat() {
    const candidates = [
      { mimeType: "audio/webm;codecs=opus", extension: "webm" },
      { mimeType: "audio/webm", extension: "webm" },
      { mimeType: "audio/ogg;codecs=opus", extension: "ogg" },
      { mimeType: "audio/ogg", extension: "ogg" },
      { mimeType: "audio/mp4", extension: "m4a" }
    ]

    for (const candidate of candidates) {
      if (MediaRecorder.isTypeSupported(candidate.mimeType)) return candidate
    }

    return { mimeType: "", extension: "" }
  }

  attachRecordedAudio(file) {
    if (!this.hasFileInputTarget) return

    const dataTransfer = new DataTransfer()
    Array.from(this.fileInputTarget.files).forEach((existing) => {
      dataTransfer.items.add(existing)
    })
    dataTransfer.items.add(file)
    this.fileInputTarget.files = dataTransfer.files
    this.filesChanged()
  }

  setMicUnavailable(message) {
    this.hasMic = false
    if (this.hasRecordButtonTarget) {
      this.recordButtonTarget.disabled = true
      this.recordButtonTarget.classList.add("cursor-not-allowed", "opacity-60")
      this.recordButtonTarget.setAttribute("aria-pressed", "false")
    }
    if (message) this.showRecordStatus(message)
  }

  showRecordStatus(message) {
    if (!this.hasRecordStatusTarget) return
    this.recordStatusTarget.textContent = message
    this.recordStatusTarget.classList.remove("hidden")
  }

  clearRecordStatus() {
    if (!this.hasRecordStatusTarget) return
    this.recordStatusTarget.classList.add("hidden")
  }

  updateRecordUI() {
    if (!this.hasRecordButtonTarget) return

    if (this.isRecording) {
      this.recordButtonTarget.classList.add("ring-2", "ring-rose-500/40", "animate-pulse")
      this.recordButtonTarget.setAttribute("aria-pressed", "true")
      this.showRecordStatus("Grabando audio...")
    } else {
      this.recordButtonTarget.classList.remove("ring-2", "ring-rose-500/40", "animate-pulse")
      this.recordButtonTarget.setAttribute("aria-pressed", "false")
      this.clearRecordStatus()
    }
  }

  releaseStream() {
    if (!this.stream) return
    this.stream.getTracks().forEach((track) => track.stop())
    this.stream = null
  }

  reset(event) {
    if (!event.detail.success) return

    const textarea = this.element.querySelector("textarea")
    if (textarea) textarea.value = ""

    if (this.hasFileInputTarget) this.fileInputTarget.value = ""
    if (this.hasNoticeTarget) this.noticeTarget.classList.add("hidden")
    if (this.hasRecordStatusTarget && (!this.hasRecordButtonTarget || !this.recordButtonTarget.disabled)) {
      this.recordStatusTarget.classList.add("hidden")
    }

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
