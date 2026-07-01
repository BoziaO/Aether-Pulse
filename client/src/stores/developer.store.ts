import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Socket } from 'socket.io-client'

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
  let perfInterval: ReturnType<typeof setInterval> | null = null
  let latencyInterval: ReturnType<typeof setInterval> | null = null
  let dbInterval: ReturnType<typeof setInterval> | null = null
  let rafId: number | null = null
  let socketRef: Socket | null = null

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

  // --- FPS measurement via requestAnimationFrame ---
  function measureFps() {
    fpsFrameCount++
    const now = performance.now()
    const delta = now - fpsLastTime
    if (delta >= 1000) {
      performanceMetrics.value.fps = Math.round((fpsFrameCount * 1000) / delta)
      fpsFrameCount = 0
      fpsLastTime = now
    }
    rafId = requestAnimationFrame(measureFps)
  }

  // --- Memory + latency polling ---
  function updatePerformanceMetrics() {
    const perf = performance as any
    if (perf.memory) {
      performanceMetrics.value.memoryUsed = Math.round(perf.memory.usedJSHeapSize / 1024 / 1024)
      performanceMetrics.value.memoryTotal = Math.round(perf.memory.jsHeapSizeLimit / 1024 / 1024)
    }
  }

  // --- Socket.IO ping latency ---
  async function measureLatency() {
    if (!socketRef?.connected) return
    const start = performance.now()
    socketRef.emit('ping')
    socketRef.once('pong', () => {
      performanceMetrics.value.latency = Math.round(performance.now() - start)
    })
  }

  // --- DB health check ---
  async function fetchDbHealth() {
    try {
      const res = await fetch('/api/health')
      const data = await res.json()
      debugInfo.value.db.connected = data.db?.ok ?? false
      debugInfo.value.db.latency = data.db?.latencyMs ?? null
    } catch {
      debugInfo.value.db.connected = false
      debugInfo.value.db.latency = null
    }
  }

  // --- Attach to a live Socket.IO instance ---
  function attachSocket(socket: Socket) {
    if (socketRef === socket) return
    socketRef = socket

    // Connection state
    socket.on('connect', () => {
      const transport = (socket as any).transport?.name || (socket as any).io?.engine?.transport?.name || 'unknown'
      updateSocketInfo({
        connected: true,
        socketId: socket.id ?? null,
        transport,
      })
      addLog('info', 'Socket', `Connected (id: ${socket.id}, transport: ${transport})`)
    })

    socket.on('disconnect', (reason: string) => {
      updateSocketInfo({ connected: false })
      addLog('warn', 'Socket', `Disconnected: ${reason}`)
    })

    socket.on('connect_error', (err: Error) => {
      updateSocketInfo({ connected: false })
      addLog('error', 'Socket', `Connection error: ${err.message}`)
    })

    socket.io.on('reconnect', (attempt: number) => {
      addLog('info', 'Socket', `Reconnected after ${attempt} attempts`)
    })

    // Packet counting
    const origEmit = socket.emit.bind(socket)
    const wrappedEmit: typeof socket.emit = function (ev: any) {
      updateSocketInfo({ packetsSent: debugInfo.value.socket.packetsSent + 1 })
      return (origEmit as any)(ev, ...Array.prototype.slice.call(arguments, 1))
    } as any
    socket.emit = wrappedEmit

    socket.onAny(() => {
      updateSocketInfo({ packetsReceived: debugInfo.value.socket.packetsReceived + 1 })
    })

    // Sync initial state if already connected
    if (socket.connected) {
      const transport = (socket as any).transport?.name || (socket as any).io?.engine?.transport?.name || 'unknown'
      updateSocketInfo({
        connected: true,
        socketId: socket.id ?? null,
        transport,
      })
    }
  }

  // --- FPS tracking ---
  function startTracking() {
    if (rafId !== null) return
    fpsLastTime = performance.now()
    fpsFrameCount = 0
    measureFps()
    perfInterval = setInterval(updatePerformanceMetrics, 1000)
    latencyInterval = setInterval(measureLatency, 5000)
    dbInterval = setInterval(fetchDbHealth, 10000)
    fetchDbHealth()
    addLog('info', 'DevTools', 'Performance tracking started')
  }

  function stopTracking() {
    if (rafId !== null) {
      cancelAnimationFrame(rafId)
      rafId = null
    }
    if (perfInterval) {
      clearInterval(perfInterval)
      perfInterval = null
    }
    if (latencyInterval) {
      clearInterval(latencyInterval)
      latencyInterval = null
    }
    if (dbInterval) {
      clearInterval(dbInterval)
      dbInterval = null
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
    attachSocket,
    startTracking,
    stopTracking,
    $dispose,
  }
})
