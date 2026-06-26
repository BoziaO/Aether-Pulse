import type { Socket } from 'socket.io'
import { User, Message, Room } from '@workspace/db'

import { serializeUser } from '../../utils/serialize-user'
import { broadcastMessage } from '../../utils/message-helpers'
import { isRoomMember } from '../../utils/room-auth'
import { callUsers, addUserSocket, removeSocketFromList } from '../state'
import { logger } from '../../utils/logger'

function updateRoomActiveState(io: any, roomId: string) {
  const callers = callUsers.get(roomId) ?? []
  const isActive = callers.length > 0
  Room.findByIdAndUpdate(roomId, { isActive })
    .then(() => {
      io.to(roomId).emit('room-activity-changed', { roomId, isActive })
    })
    .catch((err: unknown) => {
      logger.error({ err, roomId }, 'Error updating room active state')
    })
}

async function insertSystemMessage(io: any, roomId: string, userId: string, content: string) {
  try {
    const msg = await Message.create({ roomId, userId, content, type: 'system' })
    const user = await User.findById(userId).lean()
    const payload = {
      id: msg._id.toString(),
      roomId: msg.roomId.toString(),
      userId: msg.userId.toString(),
      content: msg.content,
      type: msg.type,
      replyToId: null,
      editedAt: null,
      isDeleted: false,
      createdAt: msg.createdAt.toISOString(),
      user: user ? serializeUser(user as any) : null,
      reactions: [],
      replyTo: null,
    }
    broadcastMessage(io, roomId, 'new-message', payload)
  } catch (e) {
    logger.error({ err: e, roomId, userId }, 'Failed to insert system message')
  }
}

export function registerCallHandlers(socket: Socket, io: any, authedUserId: string) {
  socket.on('join-call', async ({ roomId, userId }) => {
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
        socket.emit('error', { message: 'Failed to join call' })
        return
      }
      if (!member) {
        socket.emit('error', { message: 'Not a room member' })
        return
      }

      if (!callUsers.has(roomId)) {
        callUsers.set(roomId, [])
      }
      const callers = callUsers.get(roomId)!
      const wasInCall = callers.some((u) => u.userId === userId)
      addUserSocket(callers, userId, socket.id)

      socket.emit('call-users', {
        users: callers.filter((u) => u.userId !== userId),
      })

      if (!wasInCall) {
        socket.to(roomId).emit('call-user-joined', { userId, socketId: socket.id })
        const user = await User.findById(userId).lean()
        if (user) {
          await insertSystemMessage(
            io,
            roomId,
            userId,
            `${user.displayName} joined the voice channel`
          )
        }
      }

      updateRoomActiveState(io, roomId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in join-call')
    }
  })

  socket.on('leave-call', async ({ roomId, userId }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }

      const callers = callUsers.get(roomId) ?? []
      const remaining = removeSocketFromList(callers, socket.id)
      if (remaining.length === 0) {
        callUsers.delete(roomId)
      } else {
        callUsers.set(roomId, remaining)
      }

      const isStillInCall = remaining.some((u) => u.userId === userId)
      if (!isStillInCall) {
        socket.to(roomId).emit('call-user-left', { userId, socketId: socket.id })
      }

      updateRoomActiveState(io, roomId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in leave-call')
    }
  })

  socket.on('offer', ({ to, offer, fromUserId }) => {
    if (!fromUserId || fromUserId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    io.to(to).emit('offer', { from: socket.id, fromUserId: authedUserId, offer })
  })

  socket.on('answer', ({ to, answer, fromUserId }) => {
    if (!fromUserId || fromUserId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    io.to(to).emit('answer', { from: socket.id, fromUserId: authedUserId, answer })
  })

  socket.on('ice-candidate', ({ to, candidate, fromUserId }) => {
    if (!fromUserId || fromUserId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    io.to(to).emit('ice-candidate', { from: socket.id, fromUserId: authedUserId, candidate })
  })
}
