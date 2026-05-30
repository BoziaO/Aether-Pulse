export type ScreenShareQuality = 'gaming' | 'movie' | 'standard'

interface ShareConfig {
  width: number
  height: number
  frameRate: number
  audio: boolean
}

const CONFIGS: Record<ScreenShareQuality, ShareConfig> = {
  gaming: { width: 1920, height: 1080, frameRate: 60, audio: false },
  movie:  { width: 1920, height: 1080, frameRate: 30, audio: true  },
  standard: { width: 1280, height: 720, frameRate: 30, audio: false },
}

export async function startScreenShare(quality: ScreenShareQuality = 'standard'): Promise<MediaStream> {
  const cfg = CONFIGS[quality]
  const stream = await navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: cfg.width },
      height: { ideal: cfg.height },
      frameRate: { ideal: cfg.frameRate },
    },
    audio: cfg.audio,
  })
  return stream
}

export function getShareLabel(quality: ScreenShareQuality): string {
  return { gaming: '🎮 Gaming (1080p 60fps)', movie: '🎬 Movie (1080p 30fps)', standard: '🖥️ Standard (720p 30fps)' }[quality]
}
