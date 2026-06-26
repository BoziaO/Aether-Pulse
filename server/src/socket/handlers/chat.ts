import type { Socket } from 'socket.io'
import { Message } from '@workspace/db'

import { buildMessagePayload, broadcastMessage } from '../../utils/message-helpers'
import { isRoomMember } from '../../utils/room-auth'
import { isDuplicateMessage } from '../dedup'
import { logger } from '../../utils/logger'

export function registerChatHandlers(socket: Socket, io: any, authedUserId: string) {
  socket.on('chat-message', async ({ roomId, userId, content, replyToId }) => {
    if (!roomId || !userId) {
      socket.emit('error', { message: 'Invalid room or user ID' })
      return
    }
    if (userId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    if (!content?.trim()) {
      socket.emit('error', { message: 'Message content cannot be empty' })
      return
    }

    if (isDuplicateMessage(roomId, userId, content.trim())) {
      logger.warn({ roomId, userId }, 'Duplicate chat-message suppressed')
      return
    }

    let member: boolean
    try {
      member = await isRoomMember(roomId, userId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error checking room membership for message')
      socket.emit('error', { message: 'Failed to send message' })
      return
    }
    if (!member) {
      socket.emit('error', { message: 'Not a room member' })
      return
    }

    try {
      const msg = await Message.create({
        roomId,
        userId,
        content: content.trim(),
        type: 'text',
        replyToId: replyToId || undefined,
      })
      const payload = await buildMessagePayload(msg._id.toString())
      if (payload) {
        broadcastMessage(io, roomId, 'new-message', payload)
      }
    } catch (e) {
      logger.error({ err: e }, 'Failed to save chat message')
    }
  })

  socket.on('user-typing', async ({ roomId, userId, isTyping }) => {
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
      logger.error({ err: e, roomId, userId }, 'Error handling user-typing')
      return
    }
    if (!member) {
      socket.emit('error', { message: 'Not a room member' })
      return
    }

    socket.to(roomId).emit('user-typing', { userId, isTyping })
  })
}
