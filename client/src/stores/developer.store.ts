import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

export interface LogEntry {
  id: number
  timestamp: number
  level: 'info' | 'warn' | 'error' | 'debug'
  source: string
  message: string
  data?: unknown
}

export interface PerformanceMetrics {
  fps: number
  memoryUsed: number
  memoryTotal: number
  latency: number
}

export interface SocketInfo {
  connected: boolean
  socketId: string | null
  transport: string | null
  packetsSent: number
  packetsReceived: number
}

export interface WebRTCInfo {
  state: 'new' | 'connecting' | 'connected' | 'disconnected' | 'failed'
  localStreams: number
  remoteStreams: number
  iceState: string | null
}

export interface DebugInfo {
  socket: SocketInfo
  webrtc: WebRTCInfo
  db: {
    connected: boolean
    latency: number | null
  }
}

const MAX_LOGS = 500

export const useDeveloperStore = defineStore('developer', () => {
  const isPanelOpen = ref(false)
  const activeTab = ref<'info' | 'logs' | 'api' | 'performance'>('info')
  const logs = ref<LogEntry[]>([])
  let logIdCounter = 0

  const debugInfo = ref<DebugInfo>({
    socket: {
      connected: false,
      socketId: null,
      transport: null,
      packetsSent: 0,
      packetsReceived: 0,
    },
    webrtc: {
      state: 'new',
      localStreams: 0,
      remoteStreams: 0,
      iceState: null,
    },
    db: {
      connected: false,
      latency: null,
    },
  })

  const performanceMetrics = ref<PerformanceMetrics>({
    fps: 0,
    memoryUsed: 0,
    memoryTotal: 0,
    latency: 0,
  })

  let fpsFrameCount = 0
  let fpsLastTime = performance.now()
  let fpsInterval: ReturnType<typeof setInterval> | null = null
  let perfInterval: ReturnType<typeof setInterval> | null = null

  function addLog(level: LogEntry['level'], source: string, message: string, data?: unknown) {
    const entry: LogEntry = {
      id: logIdCounter++,
      timestamp: Date.now(),
      level,
      source,
      message,
      data,
    }
    logs.value.unshift(entry)
    if (logs.value.length > MAX_LOGS) {
      logs.value = logs.value.slice(0, MAX_LOGS)
    }
  }

  function clearLogs() {
    logs.value = []
  }

  function togglePanel() {
    isPanelOpen.value = !isPanelOpen.value
  }

  function setTab(tab: typeof activeTab.value) {
    activeTab.value = tab
  }

  function updateSocketInfo(info: Partial<SocketInfo>) {
    Object.assign(debugInfo.value.socket, info)
  }

  function updateWebRTCInfo(info: Partial<WebRTCInfo>) {
    Object.assign(debugInfo.value.webrtc, info)
  }

  function updateDbInfo(info: Partial<DebugInfo['db']>) {
    Object.assign(debugInfo.value.db, info)
  }

  function measureFps() {
    const now = performance.now()
    const delta = now - fpsLastTime
    if (delta >= 1000) {
      performanceMetrics.value.fps = Math.round((fpsFrameCount * 1000) / delta)
      fpsFrameCount = 0
      fpsLastTime = now
    }
    fpsFrameCount++
    if (isPanelOpen.value) {
      requestAnimationFrame(measureFps)
    }
  }

  function updatePerformanceMetrics() {
    const perf = performance as any
    if (perf.memory) {
      performanceMetrics.value.memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
      performanceMetrics.value.memoryTotal = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  function startTracking() {
    if (fpsInterval) return
    fpsLastTime = performance.now()
    fpsFrameCount = 0
    requestAnimationFrame(measureFps)
    perfInterval = setInterval(updatePerformanceMetrics, 1000)
    addLog('info', 'DevTools', 'Performance tracking started')
  }

  function stopTracking() {
    if (fpsInterval) {
      clearInterval(fpsInterval)
      fpsInterval = null
    }
    if (perfInterval) {
      clearInterval(perfInterval)
      perfInterval = null
    }
  }

  function $dispose() {
    stopTracking()
  }

  const filteredLogs = computed(() => logs.value)

  const recentErrors = computed(() =>
    logs.value.filter((l) => l.level === 'error').slice(0, 10)
  )

  return {
    isPanelOpen,
    activeTab,
    logs,
    debugInfo,
    performanceMetrics,
    filteredLogs,
    recentErrors,
    addLog,
    clearLogs,
    togglePanel,
    setTab,
    updateSocketInfo,
    updateWebRTCInfo,
    updateDbInfo,
    startTracking,
    stopTracking,
    $dispose,
  }
})
