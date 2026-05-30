class SpatialAudioService {
  private audioCtx: AudioContext | null = null
  private panners = new Map<number, PannerNode>()
  private sources = new Map<number, MediaStreamAudioSourceNode>()
  private _enabled = false

  get enabled() { return this._enabled }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
  }

  enable() {
    this._enabled = true
    this.init()
  }

  disable() {
    this._enabled = false
    this.sources.forEach(s => s.disconnect())
    this.panners.forEach(p => p.disconnect())
    this.sources.clear()
    this.panners.clear()
  }

  attachStream(userId: number, stream: MediaStream, position = { x: 1.5, y: 0, z: 0 }) {
    if (!this.audioCtx || !this._enabled) return
    this.detachStream(userId)

    try {
      const source = this.audioCtx.createMediaStreamSource(stream)
      const panner = this.audioCtx.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1
      panner.maxDistance = 20
      panner.rolloffFactor = 1
      panner.coneInnerAngle = 360
      panner.setPosition(position.x, position.y, position.z)
      source.connect(panner)
      panner.connect(this.audioCtx.destination)
      this.sources.set(userId, source)
      this.panners.set(userId, panner)
    } catch (e) {
      console.warn('SpatialAudio: failed to attach stream', e)
    }
  }

  updatePosition(userId: number, x: number, y: number, z: number) {
    const panner = this.panners.get(userId)
    if (panner) panner.setPosition(x, y, z)
  }

  detachStream(userId: number) {
    this.sources.get(userId)?.disconnect()
    this.panners.get(userId)?.disconnect()
    this.sources.delete(userId)
    this.panners.delete(userId)
  }

  cleanup() {
    this.sources.forEach(s => s.disconnect())
    this.panners.forEach(p => p.disconnect())
    this.sources.clear()
    this.panners.clear()
  }
}

export const spatialAudio = new SpatialAudioService()
