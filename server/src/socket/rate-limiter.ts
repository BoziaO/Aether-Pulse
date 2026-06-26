import type { Socket } from 'socket.io'

const WINDOW_MS = 1000
const DEFAULTS: Record<string, number> = {
  'chat-message': 3,
  'dm-message': 3,
  'join-room': 10,
  'join-call': 5,
  'leave-call': 5,
  offer: 5,
  answer: 5,
  'ice-candidate': 10,
  'user-typing': 10,
  'dm-typing': 10,
}

const socketTimestamps = new Map<string, Map<string, number[]>>()

export function createRateLimiter(socket: Socket, overrides?: Record<string, number>) {
  const limits = { ...DEFAULTS, ...overrides }
  const perSocket = new Map<string, number[]>()
  socketTimestamps.set(socket.id, perSocket)

  socket.use(([event], next) => {
    const maxPerWindow = limits[event as string]
    if (!maxPerWindow) return next()

    const now = Date.now()
    const timestamps = perSocket.get(event as string) ?? []
    const recent = timestamps.filter((t) => now - t < WINDOW_MS)

    if (recent.length >= maxPerWindow) {
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' })
      return
    }

    recent.push(now)
    perSocket.set(event as string, recent)
    next()
  })
}

export function cleanupRateLimiter(socketId: string) {
  socketTimestamps.delete(socketId)
}
