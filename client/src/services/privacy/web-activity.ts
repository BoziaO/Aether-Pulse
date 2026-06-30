import { ref, onMounted, onUnmounted, computed } from 'vue'

export interface WebActivity {
  type: 'tab-focus' | 'media-playing' | 'idle' | 'typing' | 'screen-share'
  details: string
  icon: string
  timestamp: number
}

const IDLE_THRESHOLD = 60000
const activities = ref<WebActivity[]>([])
let lastActivity = Date.now()
let idleCheck: ReturnType<typeof setInterval> | null = null
let mediaObserver: MutationObserver | null = null

function detectMediaPlaying(): boolean {
  const videos = document.querySelectorAll('video')
  for (const v of videos) {
    if (!v.paused && !v.muted) return true
  }
  const audios = document.querySelectorAll('audio')
  for (const a of audios) {
    if (!a.paused && !a.muted) return true
  }
  return false
}

function detectTabTitle(): string | null {
  const title = document.title
  if (!title || title === 'Nicori') return null

  const lower = title.toLowerCase()

  if (lower.includes('spotify') || lower.includes('listening')) {
    return 'Slucha muzyki'
  }
  if (lower.includes('youtube') || lower.includes('watching')) {
    return 'Oglada wideo'
  }
  if (lower.includes('vscode') || lower.includes('vscodium') || lower.includes('editing')) {
    return 'Edytuje kod'
  }
  if (lower.includes('figma') || lower.includes('designing')) {
    return 'Projektuje'
  }

  return title
}

function trackActivity(type: WebActivity['type'], details: string, icon: string) {
  lastActivity = Date.now()
  const existing = activities.value.find((a) => a.type === type && a.details === details)
  if (existing) {
    existing.timestamp = Date.now()
  } else {
    activities.value.push({ type, details, icon, timestamp: Date.now() })
    if (activities.value.length > 10) {
      activities.value = activities.value.slice(-10)
    }
  }
}

function checkIdle() {
  const now = Date.now()
  if (now - lastActivity > IDLE_THRESHOLD) {
    const idleActivity = activities.value.find((a) => a.type === 'idle')
    if (!idleActivity) {
      activities.value.push({
        type: 'idle',
        details: 'Bezczynny',
        icon: 'clock',
        timestamp: now,
      })
    }
  }
}

function setupMediaDetection() {
  const checkMedia = () => {
    if (detectMediaPlaying()) {
      const titleInfo = detectTabTitle()
      trackActivity('media-playing', titleInfo || 'Odtwarza media', 'play')
    }
  }

  mediaObserver = new MutationObserver(checkMedia)
  mediaObserver.observe(document.body, { childList: true, subtree: true })

  document.addEventListener('play', checkMedia, true)
  document.addEventListener('pause', () => {
    activities.value = activities.value.filter((a) => a.type !== 'media-playing')
  }, true)
}

function setupTitleDetection() {
  const observer = new MutationObserver(() => {
    const info = detectTabTitle()
    if (info) {
      const category = info.includes('muzyki') ? 'music' : info.includes('wideo') ? 'video' : 'default'
      trackActivity('media-playing', info, category === 'music' ? 'music' : 'play')
    }
  })

  const titleEl = document.querySelector('title')
  if (titleEl) {
    observer.observe(titleEl, { childList: true, characterData: true, subtree: true })
  }
}

function setupInputDetection() {
  let typingTimeout: ReturnType<typeof setTimeout> | null = null

  document.addEventListener('keydown', () => {
    lastActivity = Date.now()
    trackActivity('typing', 'Pisze', 'keyboard')
    if (typingTimeout) clearTimeout(typingTimeout)
    typingTimeout = setTimeout(() => {
      activities.value = activities.value.filter((a) => a.type !== 'typing')
    }, 3000)
  })
}

export function useWebActivityDetection() {
  const webActivities = computed(() => activities.value)
  const isIdle = computed(() => activities.value.some((a) => a.type === 'idle'))
  const isMediaPlaying = computed(() => activities.value.some((a) => a.type === 'media-playing'))

  onMounted(() => {
    setupMediaDetection()
    setupTitleDetection()
    setupInputDetection()
    idleCheck = setInterval(checkIdle, 10000)

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        trackActivity('tab-focus', 'W tle', 'minimize-2')
      } else {
        activities.value = activities.value.filter((a) => a.type !== 'tab-focus')
        lastActivity = Date.now()
      }
    })
  })

  onUnmounted(() => {
    if (idleCheck) {
      clearInterval(idleCheck)
      idleCheck = null
    }
    if (mediaObserver) {
      mediaObserver.disconnect()
      mediaObserver = null
    }
  })

  return {
    webActivities,
    isIdle,
    isMediaPlaying,
  }
}
