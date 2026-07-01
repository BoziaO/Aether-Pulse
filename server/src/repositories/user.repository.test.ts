import { describe, it, expect, vi, beforeEach } from 'vitest'
import mongoose from 'mongoose'

// Mock the User model
vi.mock('@workspace/db', () => ({
  User: {
    findById: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    findByIdAndUpdate: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    findOne: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue(null) }),
    create: vi.fn().mockResolvedValue({ toObject: vi.fn().mockReturnValue({}) }),
    find: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]), limit: vi.fn().mockReturnValue({ lean: vi.fn().mockResolvedValue([]) }) }),
  },
}))

import { UserRepository } from './user.repository'

describe('UserRepository', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('findById', () => {
    it('should throw error for invalid ObjectId', async () => {
      await expect(UserRepository.findById('invalid-id')).rejects.toThrow('Invalid ID format')
    })

    it('should accept valid ObjectId', async () => {
      const validId = new mongoose.Types.ObjectId().toString()
      await UserRepository.findById(validId)
      // Should not throw
    })
  })

  describe('findByIdAndUpdate', () => {
    it('should throw error for invalid ObjectId', async () => {
      await expect(
        UserRepository.findByIdAndUpdate('invalid-id', { status: 'online' })
      ).rejects.toThrow('Invalid ID format')
    })
  })

  describe('updateStatus', () => {
    it('should throw error for invalid ObjectId', async () => {
      await expect(UserRepository.updateStatus('invalid-id', 'online')).rejects.toThrow(
        'Invalid ID format'
      )
    })
  })

  describe('search', () => {
    it('should throw error for invalid excludeId', async () => {
      await expect(UserRepository.search('test', 'invalid-id')).rejects.toThrow(
        'Invalid ID format'
      )
    })
  })

  describe('findByIds', () => {
    it('should throw error for invalid ID in array', async () => {
      await expect(UserRepository.findByIds(['valid-id', 'invalid'])).rejects.toThrow(
        'Invalid ID format'
      )
    })
  })
})
