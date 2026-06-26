import type { Server as SocketIOServer } from 'socket.io'

import type { ClientToServerEvents, ServerToClientEvents } from './types'

const HEARTBEAT_INTERVAL = 30_000
const STALE_THRESHOLD_MS = 120_000

let heartbeatTimer: ReturnType<typeof setInterval> | null = null

const lastHeartbeat = new Map<string, number>()

export function startHeartbeat(io: SocketIOServer<ClientToServerEvents, ServerToClientEvents>) {
  if (heartbeatTimer) return

  heartbeatTimer = setInterval(() => {
    const now = Date.now()
    io.emit('heartbeat', { ts: now })

    for (const [socketId, last] of lastHeartbeat.entries()) {
      if (now - last > STALE_THRESHOLD_MS) {
        const socket = io.sockets.sockets.get(socketId)
        if (socket) {
          socket.disconnect(true)
        }
        lastHeartbeat.delete(socketId)
      }
    }
  }, HEARTBEAT_INTERVAL)
}

export function stopHeartbeat() {
  if (heartbeatTimer) {
    clearInterval(heartbeatTimer)
    heartbeatTimer = null
  }
}

export function trackHeartbeat(socketId: string) {
  lastHeartbeat.set(socketId, Date.now())
}

export function untrackHeartbeat(socketId: string) {
  lastHeartbeat.delete(socketId)
}
