import type { Socket } from 'socket.io'

import { isRoomMember } from '../../utils/room-auth'
import {
  roomUsers,
  addUserSocket,
  removeSocketFromList,
  trackSocketRoom,
  untrackSocketRoom,
} from '../state'
import { logger } from '../../utils/logger'

export function registerRoomHandlers(socket: Socket, authedUserId: string) {
  socket.on('join-room', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }

      let member: boolean
      try {
        member = await isRoomMember(roomId, userId)
      } catch (e) {
        logger.error({ err: e, roomId, userId }, 'Error checking room membership')
        socket.emit('error', { message: 'Failed to join room' })
        return
      }
      if (!member) {
        socket.emit('error', { message: 'Not a room member' })
        return
      }

      socket.join(roomId)
      trackSocketRoom(socket.id, roomId)

      if (!roomUsers.has(roomId)) {
        roomUsers.set(roomId, [])
      }
      const users = roomUsers.get(roomId)!
      const wasOnline = users.some((u) => u.userId === userId)
      addUserSocket(users, userId, socket.id)

      const roomUserIds = Array.from(new Set(users.map((u) => u.userId)))
      socket.emit('room-users', { userIds: roomUserIds })
      if (!wasOnline) {
        socket.to(roomId).emit('user-joined', { userId, socketId: socket.id })
      }

      logger.info({ socketId: socket.id, roomId, userId }, 'User joined room')
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in join-room')
    }
  })

  socket.on('leave-room', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }

      socket.leave(roomId)
      untrackSocketRoom(socket.id, roomId)

      const users = roomUsers.get(roomId) ?? []
      const remaining = removeSocketFromList(users, socket.id)
      if (remaining.length === 0) {
        roomUsers.delete(roomId)
      } else {
        roomUsers.set(roomId, remaining)
      }

      const isStillOnline = remaining.some((u) => u.userId === userId)
      if (!isStillOnline) {
        socket.to(roomId).emit('user-left', { userId, socketId: socket.id })
      }
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in leave-room')
    }
  })
}
