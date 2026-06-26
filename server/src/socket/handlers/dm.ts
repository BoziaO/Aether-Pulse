import type { Socket } from 'socket.io'
import { DmMessage, DmConversation } from '@workspace/db'

import { buildDmMessagePayload, isDmParticipant } from '../../utils/dm-helpers'
import { isDuplicateMessage } from '../dedup'
import { logger } from '../../utils/logger'

export function registerDmHandlers(socket: Socket, io: any, authedUserId: string) {
  socket.on('join-dm', async ({ conversationId }) => {
    if (!conversationId) {
      socket.emit('error', { message: 'Invalid conversation ID' })
      return
    }

    try {
      if (!(await isDmParticipant(conversationId, authedUserId))) {
        socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
        return
      }
      socket.join(`dm:${conversationId}`)
    } catch (e) {
      logger.error({ err: e, conversationId, userId: authedUserId }, 'Error joining DM')
      socket.emit('error', { message: 'Failed to join conversation' })
    }
  })

  socket.on('leave-dm', ({ conversationId }) => {
    if (!conversationId) {
      socket.emit('error', { message: 'Invalid conversation ID' })
      return
    }
    socket.leave(`dm:${conversationId}`)
  })

  socket.on('dm-typing', async ({ conversationId, isTyping }) => {
    if (!conversationId) {
      socket.emit('error', { message: 'Invalid conversation ID' })
      return
    }

    try {
      if (!(await isDmParticipant(conversationId, authedUserId))) {
        socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
        return
      }
      socket
        .to(`dm:${conversationId}`)
        .emit('dm-typing', { conversationId, userId: authedUserId, isTyping: !!isTyping })
    } catch (e) {
      logger.error({ err: e, conversationId, userId: authedUserId }, 'Error in dm-typing')
    }
  })

  socket.on('dm-message', async ({ conversationId, content, replyToId }) => {
    if (!conversationId || !content?.trim()) {
      socket.emit('error', { message: 'Invalid conversation ID or empty content' })
      return
    }

    if (isDuplicateMessage(conversationId, authedUserId, content.trim())) {
      logger.warn({ conversationId, userId: authedUserId }, 'Duplicate dm-message suppressed')
      return
    }

    try {
      if (!(await isDmParticipant(conversationId, authedUserId))) {
        socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
        return
      }
    } catch (e) {
      logger.error({ err: e, conversationId, userId: authedUserId }, 'Error checking DM membership')
      socket.emit('error', { message: 'Failed to send message' })
      return
    }

    try {
      const msg = await DmMessage.create({
        conversationId,
        userId: authedUserId,
        content: content.trim(),
        type: 'text',
        replyToId: replyToId || undefined,
      })
      await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })
      const payload = await buildDmMessagePayload(msg._id.toString())
      if (payload) {
        io.to(`dm:${conversationId}`).emit('new-dm-message', payload)
      }
    } catch (e) {
      logger.error({ err: e }, 'Failed to save DM')
    }
  })
}
