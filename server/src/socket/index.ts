import type { Server as SocketIOServer, Socket } from 'socket.io'

import type { ClientToServerEvents, ServerToClientEvents } from './types'
import { socketAuthMiddleware } from './auth'
import { createRateLimiter, cleanupRateLimiter } from './rate-limiter'
import { cleanupUserDedup } from './dedup'
import { roomUsers, callUsers, removeAllSocketRooms } from './state'
import { startHeartbeat, untrackHeartbeat } from './heartbeat'
import { StatusService } from '../services/status.service'
import { registerRoomHandlers } from './handlers/room'
import { registerCallHandlers } from './handlers/call'
import { registerChatHandlers } from './handlers/chat'
import { registerDmHandlers } from './handlers/dm'
import { registerStatusHandlers } from './handlers/status'
import { logger } from '../utils/logger'

type TypedServer = SocketIOServer<ClientToServerEvents, ServerToClientEvents>

export function registerSocketHandlers(io: SocketIOServer): void {
  const typedIo = io as TypedServer

  io.use(socketAuthMiddleware)
  startHeartbeat(typedIo)

  io.on('connection', (rawSocket) => {
    const socket = rawSocket as Socket<ClientToServerEvents, ServerToClientEvents>
    const authedUserId: string = socket.data.userId

    if (!authedUserId) {
      socket.emit('error', { message: 'Authentication required' })
      socket.disconnect(true)
      return
    }

    socket.join(`user:${authedUserId}`)
    logger.info({ socketId: socket.id, userId: authedUserId }, 'Socket connected')

    createRateLimiter(socket)

    registerRoomHandlers(socket, authedUserId)
    registerCallHandlers(socket, typedIo, authedUserId)
    registerChatHandlers(socket, typedIo, authedUserId)
    registerDmHandlers(socket, typedIo, authedUserId)
    registerStatusHandlers(socket, typedIo, authedUserId)
    registerDisconnectHandler(socket, authedUserId)
  })
}

function registerDisconnectHandler(
  socket: Socket<ClientToServerEvents, ServerToClientEvents>,
  authedUserId: string
) {
  socket.on('disconnect', async () => {
    await StatusService.setOffline(authedUserId)

    const socketId = socket.id
    const roomIds = removeAllSocketRooms(socketId)

    const leaveEvents: Array<{ roomId: string; userId: string }> = []

    for (const roomId of roomIds) {
      const users = roomUsers.get(roomId) ?? []
      const remaining = users.filter((u) => u.socketId !== socketId)
      if (remaining.length === 0) {
        roomUsers.delete(roomId)
      } else {
        roomUsers.set(roomId, remaining)
      }

      const isStillOnline = remaining.some((u) => u.userId === authedUserId)
      if (!isStillOnline) {
        leaveEvents.push({ roomId, userId: authedUserId })
      }

      const callers = callUsers.get(roomId) ?? []
      const remainingCallers = callers.filter((u) => u.socketId !== socketId)
      if (remainingCallers.length === 0) {
        callUsers.delete(roomId)
      } else {
        callUsers.set(roomId, remainingCallers)
      }

      const isStillInCall = remainingCallers.some((u) => u.userId === authedUserId)
      if (!isStillInCall) {
        socket.to(roomId).emit('call-user-left', { userId: authedUserId, socketId })
      }
    }

    for (const ev of leaveEvents) {
      socket.to(ev.roomId).emit('user-left', { userId: ev.userId, socketId })
    }

    cleanupRateLimiter(socketId)
    cleanupUserDedup(authedUserId)
    untrackHeartbeat(socketId)
    logger.info({ socketId, userId: authedUserId }, 'Socket disconnected')
  })
}
