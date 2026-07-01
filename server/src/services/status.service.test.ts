import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('../repositories/user.repository', () => ({
  UserRepository: {
    updateStatus: vi.fn(),
  },
}))

vi.mock('../utils/logger', () => ({
  logger: {
    error: vi.fn(),
  },
}))

import { StatusService } from './status.service'
import { UserRepository } from '../repositories/user.repository'

describe('StatusService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('setOnline', () => {
    it('should update user status to online', async () => {
      vi.mocked(UserRepository.updateStatus).mockResolvedValue(undefined)

      await StatusService.setOnline('user123')

      expect(UserRepository.updateStatus).toHaveBeenCalledWith('user123', 'online')
    })

    it('should handle errors gracefully', async () => {
      vi.mocked(UserRepository.updateStatus).mockRejectedValue(new Error('DB error'))

      // Should not throw
      await StatusService.setOnline('user123')
    })
  })

  describe('setOffline', () => {
    it('should update user status to offline', async () => {
      vi.mocked(UserRepository.updateStatus).mockResolvedValue(undefined)

      await StatusService.setOffline('user123')

      expect(UserRepository.updateStatus).toHaveBeenCalledWith('user123', 'offline')
    })
  })

  describe('setStatus', () => {
    it('should update user status to custom value', async () => {
      vi.mocked(UserRepository.updateStatus).mockResolvedValue(undefined)

      await StatusService.setStatus('user123', 'busy')

      expect(UserRepository.updateStatus).toHaveBeenCalledWith('user123', 'busy')
    })
  })
})
