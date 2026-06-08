class SpatialAudioService {
  private audioCtx: AudioContext | null = null
  private masterGain: GainNode | null = null
  private sources = new Map<string, MediaStreamAudioSourceNode>()
  private panners = new Map<string, PannerNode>()
  private gains = new Map<string, GainNode>()
  private _enabled = false

  get enabled() {
    return this._enabled
  }

  init() {
    if (!this.audioCtx) {
      this.audioCtx = new AudioContext()
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume()
    }
    if (this.audioCtx && !this.masterGain) {
      this.masterGain = this.audioCtx.createGain()
      this.masterGain.gain.value = 1
      this.masterGain.connect(this.audioCtx.destination)
    }
  }

  enable() {
    this._enabled = true
    this.init()
  }

  disable() {
    this._enabled = false
    this.cleanup()
  }

  setOutputVolume(percent: number) {
    const clamped = Math.max(0, Math.min(200, percent))
    this.init()
    if (this.masterGain) this.masterGain.gain.value = clamped / 100
  }

  attachStream(userId: string, stream: MediaStream, position = { x: 1.5, y: 0, z: 0 }) {
    if (!this._enabled) return
    if (!stream.getAudioTracks().length) return

    this.init()
    if (!this.audioCtx) return
    this.detachStream(userId)

    try {
      if (this.audioCtx.state === 'suspended') {
        this.audioCtx.resume()
      }

      const source = this.audioCtx.createMediaStreamSource(stream)
      const panner = this.audioCtx.createPanner()
      panner.panningModel = 'HRTF'
      panner.distanceModel = 'inverse'
      panner.refDistance = 1
      panner.maxDistance = 20
      panner.rolloffFactor = 1
      panner.coneInnerAngle = 360

      // Modern API uses AudioParams, fallback to deprecated setPosition.
      const hasPositionParams = typeof (panner as any).positionX !== 'undefined'
      if (hasPositionParams) {
        ;(panner as any).positionX.value = position.x
        ;(panner as any).positionY.value = position.y
        ;(panner as any).positionZ.value = position.z
      } else {
        // eslint-disable-next-line deprecation/deprecation
        panner.setPosition(position.x, position.y, position.z)
      }

      const gain = this.audioCtx.createGain()
      gain.gain.value = 1

      source.connect(panner)
      panner.connect(gain)
      gain.connect(this.masterGain ?? this.audioCtx.destination)

      this.sources.set(userId, source)
      this.panners.set(userId, panner)
      this.gains.set(userId, gain)
    } catch (e) {
      console.warn('SpatialAudio: failed to attach stream', e)
    }
  }

  updatePosition(userId: string, x: number, y: number, z: number) {
    const panner = this.panners.get(userId)
    if (!panner) return
    const hasPositionParams = typeof (panner as any).positionX !== 'undefined'
    if (hasPositionParams) {
      ;(panner as any).positionX.value = x
      ;(panner as any).positionY.value = y
      ;(panner as any).positionZ.value = z
    } else {
      // eslint-disable-next-line deprecation/deprecation
      panner.setPosition(x, y, z)
    }
  }

  detachStream(userId: string) {
    this.sources.get(userId)?.disconnect()
    this.panners.get(userId)?.disconnect()
    this.gains.get(userId)?.disconnect()
    this.sources.delete(userId)
    this.panners.delete(userId)
    this.gains.delete(userId)
  }

  cleanup() {
    this.sources.forEach((s) => s.disconnect())
    this.panners.forEach((p) => p.disconnect())
    this.gains.forEach((g) => g.disconnect())
    this.sources.clear()
    this.panners.clear()
    this.gains.clear()
  }
}

export const spatialAudio = new SpatialAudioService()
