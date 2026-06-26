export type ScreenShareQuality = 'gaming' | 'movie' | 'standard'

interface ShareConfig {
  width: number
  height: number
  frameRate: number
  audio: boolean
}

const CONFIGS: Record<ScreenShareQuality, ShareConfig> = {
  gaming: { width: 1920, height: 1080, frameRate: 60, audio: false },
  movie: { width: 1920, height: 1080, frameRate: 30, audio: true },
  standard: { width: 1280, height: 720, frameRate: 30, audio: false },
}

declare global {
  interface Window {
    electronAPI?: {
      getDesktopSources: () => Promise<{ id: string; name: string; thumbnail: string }[]>
    }
  }
}

export async function startScreenShare(
  quality: ScreenShareQuality = 'standard',
  electronSourceId?: string
): Promise<MediaStream> {
  const cfg = CONFIGS[quality]

  // Android (Capacitor): getDisplayMedia not supported — share front/back camera instead
  const isAndroid =
    typeof (window as any).Capacitor !== 'undefined' && (window as any).Capacitor.isNativePlatform()
  if (isAndroid) {
    return navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: cfg.width },
        height: { ideal: cfg.height },
        frameRate: { ideal: cfg.frameRate },
        facingMode: 'environment',
      },
      audio: false,
    })
  }

  // Electron: getDisplayMedia is blocked; use desktopCapturer via IPC instead
  if (window.electronAPI?.getDesktopSources) {
    if (!electronSourceId) throw new Error('electronSourceId is required in Electron')
    return navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        // @ts-expect-error — Electron-specific constraint
        mandatory: {
          chromeMediaSource: 'desktop',
          chromeMediaSourceId: electronSourceId,
          maxWidth: cfg.width,
          maxHeight: cfg.height,
          maxFrameRate: cfg.frameRate,
        },
      },
    })
  }

  return navigator.mediaDevices.getDisplayMedia({
    video: {
      width: { ideal: cfg.width },
      height: { ideal: cfg.height },
      frameRate: { ideal: cfg.frameRate },
    },
    audio: cfg.audio,
  })
}

export function getShareLabel(quality: ScreenShareQuality): string {
  return {
    gaming: '🎮 Gaming (1080p 60fps)',
    movie: '🎬 Movie (1080p 30fps)',
    standard: '🖥️ Standard (720p 30fps)',
  }[quality]
}
