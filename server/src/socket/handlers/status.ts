import type { Socket } from 'socket.io'
import { User } from '@workspace/db'

import { serializeUser } from '../../utils/serialize-user'
import { logger } from '../../utils/logger'

export function registerStatusHandlers(socket: Socket, io: any, authedUserId: string) {
  socket.on('user-status', async ({ userId, status }) => {
    if (!userId || userId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }

    try {
      const updated = await User.findByIdAndUpdate(userId, { status }, { new: true }).lean()
      if (updated) {
        const serialized = serializeUser(updated as any, { viewerId: userId })
        io.emit('user-profile-updated', serialized)
      }
    } catch (e) {
      logger.error({ err: e, userId }, 'Error updating status')
    }
  })
}
