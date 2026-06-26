import bcrypt from 'bcryptjs'

import { UserRepository } from '../repositories/user.repository'
import { generateTokens, verifyRefreshToken } from '../middleware/auth'
import { serializeUser } from '../utils/serialize-user'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../errors/AppError'

export const AuthService = {
  async register(data: {
    username: string
    email?: string
    password: string
    displayName: string
  }) {
    const existing = await UserRepository.findOne({ username: data.username })
    if (existing) throw new ConflictError('Username already taken')

    if (data.email) {
      const existingEmail = await UserRepository.findOne({ email: data.email })
      if (existingEmail) throw new ConflictError('Email already in use')
    }

    const passwordHash = await bcrypt.hash(data.password, 10)
    const user = await UserRepository.create({
      username: data.username,
      email: data.email || null,
      passwordHash,
      displayName: data.displayName,
      status: 'online',
    })

    const tokens = generateTokens(user._id.toString(), user.username)
    return {
      user: { ...serializeUser(user as any), status: 'online' },
      ...tokens,
    }
  },

  async login(username: string, password: string) {
    const user = await UserRepository.findOne({ username })
    if (!user) throw new UnauthorizedError('Invalid credentials')

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid credentials')

    await UserRepository.updateStatus(user._id.toString(), 'online')

    const tokens = generateTokens(user._id.toString(), user.username)
    return {
      user: { ...serializeUser(user as any), status: 'online' },
      ...tokens,
    }
  },

  async logout(userId: string | undefined) {
    if (userId) {
      await UserRepository.updateStatus(userId, 'offline')
    }
  },

  async getMe(userId: string | undefined) {
    if (!userId) return { user: null }
    const user = await UserRepository.findById(userId)
    if (!user) return { user: null }
    return { user: serializeUser(user as any) }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < 8) {
      throw new ValidationError('New password must be at least 8 characters')
    }

    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Current password is incorrect')

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await UserRepository.findByIdAndUpdate(userId, { passwordHash } as any)
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) throw new UnauthorizedError('Invalid or expired refresh token')

    const user = await UserRepository.findById(payload.userId)
    if (!user) throw new UnauthorizedError('User not found')

    const tokens = generateTokens(user._id.toString(), user.username)
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  },
}
