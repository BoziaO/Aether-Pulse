import type { Socket } from 'socket.io'

import { UserRepository } from '../../repositories/user.repository'
import { serializeUser } from '../../utils/serialize-user'
import { logger } from '../../utils/logger'
import { isValidObjectId } from '../validators'

export function registerStatusHandlers(socket: Socket, io: any, authedUserId: string) {
  socket.on('user-status', async ({ userId, status }) => {
    if (!userId || userId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    if (!isValidObjectId(userId)) {
      socket.emit('error', { message: 'Invalid ID format', code: 'INVALID_ID' })
      return
    }

    try {
      const updated = await UserRepository.findByIdAndUpdate(userId, { status })
      if (updated) {
        const serialized = serializeUser(updated, { viewerId: userId })
        io.emit('user-profile-updated', serialized)
      }
    } catch (e) {
      logger.error({ err: e, userId }, 'Error updating status')
    }
  })

  socket.on('set-rich-presence', async ({ userId, richPresence }) => {
    if (!userId || userId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    if (!isValidObjectId(userId)) {
      socket.emit('error', { message: 'Invalid ID format', code: 'INVALID_ID' })
      return
    }

    try {
      const updated = await UserRepository.findByIdAndUpdate(userId, { richPresence })
      if (updated) {
        io.emit('user-rich-presence-changed', {
          userId,
          richPresence: updated.richPresence ?? null,
        })
      }
    } catch (e) {
      logger.error({ err: e, userId }, 'Error updating rich presence')
    }
  })
}
