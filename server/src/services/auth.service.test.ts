import { describe, it, expect, vi, beforeEach } from 'vitest'
import bcrypt from 'bcryptjs'

// Mock dependencies
vi.mock('../repositories/user.repository', () => ({
  UserRepository: {
    findOne: vi.fn(),
    create: vi.fn(),
    findById: vi.fn(),
    updateStatus: vi.fn(),
    updatePasswordHash: vi.fn(),
    updateResetToken: vi.fn(),
  },
}))

vi.mock('../middleware/auth', () => ({
  generateTokens: vi.fn().mockReturnValue({ accessToken: 'token', refreshToken: 'refresh' }),
  verifyRefreshToken: vi.fn(),
}))

vi.mock('../utils/serialize-user', () => ({
  serializeUser: vi.fn().mockReturnValue({ id: '1', username: 'testuser' }),
}))

vi.mock('./status.service', () => ({
  StatusService: {
    setOnline: vi.fn(),
    setOffline: vi.fn(),
  },
}))

import { AuthService } from './auth.service'
import { UserRepository } from '../repositories/user.repository'

describe('AuthService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('register', () => {
    it('should register a new user successfully', async () => {
      vi.mocked(UserRepository.findOne).mockResolvedValue(null)
      vi.mocked(UserRepository.create).mockResolvedValue({
        _id: { toString: () => '1' },
        username: 'testuser',
        passwordHash: 'hash',
        displayName: 'Test User',
        status: 'online',
        badges: [],
        socialLinks: [],
        profilePrivacy: 'public',
        showTimezone: true,
        showLastSeen: true,
        showProfileViews: true,
        profileViews: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as any)

      const result = await AuthService.register({
        username: 'testuser',
        password: 'password123',
        displayName: 'Test User',
      })

      expect(result.user).toBeDefined()
      expect(result.accessToken).toBe('token')
      expect(result.refreshToken).toBe('refresh')
    })

    it('should throw ConflictError if username exists', async () => {
      vi.mocked(UserRepository.findOne).mockResolvedValue({ username: 'testuser' } as any)

      await expect(
        AuthService.register({
          username: 'testuser',
          password: 'password123',
          displayName: 'Test User',
        })
      ).rejects.toThrow('Username already taken')
    })
  })

  describe('login', () => {
    it('should login successfully with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10)
      vi.mocked(UserRepository.findOne).mockResolvedValue({
        _id: { toString: () => '1' },
        username: 'testuser',
        passwordHash: hashedPassword,
      } as any)

      const result = await AuthService.login('testuser', 'password123')

      expect(result.user).toBeDefined()
      expect(result.accessToken).toBe('token')
    })

    it('should throw UnauthorizedError with invalid credentials', async () => {
      vi.mocked(UserRepository.findOne).mockResolvedValue(null)

      await expect(AuthService.login('testuser', 'wrongpassword')).rejects.toThrow(
        'Invalid credentials'
      )
    })
  })

  describe('changePassword', () => {
    it('should change password successfully', async () => {
      const hashedPassword = await bcrypt.hash('currentpass', 10)
      vi.mocked(UserRepository.findById).mockResolvedValue({
        _id: { toString: () => '1' },
        passwordHash: hashedPassword,
      } as any)

      await AuthService.changePassword('1', 'currentpass', 'newpassword123')

      expect(UserRepository.updatePasswordHash).toHaveBeenCalledWith(
        '1',
        expect.any(String)
      )
    })

    it('should throw ValidationError if password too short', async () => {
      await expect(
        AuthService.changePassword('1', 'current', 'short')
      ).rejects.toThrow('Password must be at least 8 characters')
    })

    it('should throw UnauthorizedError if current password is wrong', async () => {
      const hashedPassword = await bcrypt.hash('correctpass', 10)
      vi.mocked(UserRepository.findById).mockResolvedValue({
        _id: { toString: () => '1' },
        passwordHash: hashedPassword,
      } as any)

      await expect(
        AuthService.changePassword('1', 'wrongpass', 'newpassword123')
      ).rejects.toThrow('Current password is incorrect')
    })
  })
})
