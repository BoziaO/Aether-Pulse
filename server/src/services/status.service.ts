import { UserRepository } from '../repositories/user.repository'
import { logger } from '../utils/logger'

export const StatusService = {
  async setOnline(userId: string): Promise<void> {
    try {
      await UserRepository.updateStatus(userId, 'online')
    } catch (err) {
      logger.error({ err, userId }, 'Failed to set user online')
    }
  },

  async setOffline(userId: string): Promise<void> {
    try {
      await UserRepository.updateStatus(userId, 'offline')
    } catch (err) {
      logger.error({ err, userId }, 'Failed to set user offline')
    }
  },

  async setStatus(userId: string, status: 'online' | 'away' | 'busy' | 'offline'): Promise<void> {
    try {
      await UserRepository.updateStatus(userId, status)
    } catch (err) {
      logger.error({ err, userId, status }, 'Failed to update user status')
    }
  },
}
