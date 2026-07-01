import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import nodemailer from 'nodemailer'

import { UserRepository } from '../repositories/user.repository'
import { generateTokens, verifyRefreshToken } from '../middleware/auth'
import { serializeUser } from '../utils/serialize-user'
import { StatusService } from './status.service'
import {
  ConflictError,
  UnauthorizedError,
  NotFoundError,
  ValidationError,
} from '../errors/AppError'

const resetTokenExpiresIn = 60 * 60 * 1000
const MIN_PASSWORD_LENGTH = 8

const transporter =
  process.env.SMTP_HOST
    ? nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT || 587,
        secure: process.env.SMTP_PORT === 465,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      })
    : null

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

    await StatusService.setOnline(user._id.toString())

    const tokens = generateTokens(user._id.toString(), user.username)
    return {
      user: { ...serializeUser(user as any), status: 'online' },
      ...tokens,
    }
  },

  async logout(userId: string | undefined) {
    if (userId) {
      await StatusService.setOffline(userId)
    }
  },

  async getMe(userId: string | undefined) {
    if (!userId) return { user: null }
    const user = await UserRepository.findById(userId)
    if (!user) return { user: null }
    return { user: serializeUser(user as any) }
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }

    const user = await UserRepository.findById(userId)
    if (!user) throw new NotFoundError('User not found')

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Current password is incorrect')

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await UserRepository.updatePasswordHash(userId, passwordHash)
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken)
    if (!payload) throw new UnauthorizedError('Invalid or expired refresh token')

    const user = await UserRepository.findById(payload.userId)
    if (!user) throw new UnauthorizedError('User not found')

    const tokens = generateTokens(user._id.toString(), user.username)
    return { accessToken: tokens.accessToken, refreshToken: tokens.refreshToken }
  },

  async forgotPassword(email: string) {
    const user = await UserRepository.findOne({ email })
    if (!user) {
      return { ok: true }
    }

    const resetToken = crypto.randomBytes(32).toString('hex')
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex')
    const expires = new Date(Date.now() + resetTokenExpiresIn)

    await UserRepository.updateResetToken(user._id.toString(), resetTokenHash, expires)

    if (transporter) {
      const clientUrl = process.env.CLIENT_URL || 'http://localhost:5174'
      const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`
      try {
        await transporter.sendMail({
          from: process.env.SMTP_FROM || process.env.SMTP_USER,
          to: email,
          subject: 'Reset your password',
          html: `<p>Hi ${user.displayName},</p>
<p>You requested a password reset. Click the link below to set a new password:</p>
<p><a href="${resetUrl}">${resetUrl}</a></p>
<p>This link expires in 1 hour.</p>
<p>If you didn't request this, you can safely ignore this email.</p>`,
        })
      } catch (err) {
        console.error('Failed to send reset email:', err)
      }
    }

    return { ok: true }
  },

  async resetPassword(token: string, newPassword: string) {
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      throw new ValidationError(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`)
    }

    const tokenHash = crypto.createHash('sha256').update(token).digest('hex')

    const user = await UserRepository.findOne({
      resetPasswordToken: tokenHash,
      resetPasswordExpires: { $gt: new Date() },
    })

    if (!user) {
      throw new UnauthorizedError('Invalid or expired reset token')
    }

    const passwordHash = await bcrypt.hash(newPassword, 10)
    await UserRepository.updatePasswordHash(user._id.toString(), passwordHash)
    await UserRepository.updateResetToken(user._id.toString(), null, null)

    return { ok: true }
  },

  async getOAuthUrl(provider: 'google' | 'github') {
    if (provider === 'google') {
      const clientId = process.env.GOOGLE_CLIENT_ID
      if (!clientId) throw new ValidationError('Google OAuth not configured')
      const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`
      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=openid email profile`
      return { url }
    }

    if (provider === 'github') {
      const clientId = process.env.GITHUB_CLIENT_ID
      if (!clientId) throw new ValidationError('GitHub OAuth not configured')
      const redirectUri = `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/oauth/github/callback`
      const url = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=read:user user:email`
      return { url }
    }

    throw new ValidationError('Unsupported OAuth provider')
  },

  async handleOAuthCallback(provider: 'google' | 'github', code: string) {
    if (!code || typeof code !== 'string' || code.length > 1000) {
      throw new ValidationError('Invalid authorization code')
    }

    let providerId: string
    let email: string | null = null
    let displayName: string
    let avatarUrl: string | null = null

    if (provider === 'google') {
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: process.env.GOOGLE_CLIENT_ID!,
          client_secret: process.env.GOOGLE_CLIENT_SECRET!,
          redirect_uri: `${process.env.SERVER_URL || 'http://localhost:3000'}/api/auth/oauth/google/callback`,
          grant_type: 'authorization_code',
        }),
      })
      const tokenData = await tokenRes.json() as any
      if (!tokenData.access_token) throw new UnauthorizedError('Google OAuth failed')

      const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      })
      const userInfo = await userInfoRes.json() as any
      providerId = userInfo.id
      email = userInfo.email
      displayName = userInfo.name || userInfo.email?.split('@')[0] || 'User'
      avatarUrl = userInfo.picture || null
    } else if (provider === 'github') {
      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: process.env.GITHUB_CLIENT_ID,
          client_secret: process.env.GITHUB_CLIENT_SECRET,
          code,
        }),
      })
      const tokenData = await tokenRes.json() as any
      if (!tokenData.access_token) throw new UnauthorizedError('GitHub OAuth failed')

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      const githubUser = await userRes.json() as any
      providerId = githubUser.id.toString()
      displayName = githubUser.login || githubUser.name || 'User'
      avatarUrl = githubUser.avatar_url || null

      const emailRes = await fetch('https://api.github.com/user/emails', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          Accept: 'application/vnd.github.v3+json',
        },
      })
      const emails = await emailRes.json() as any[]
      const primaryEmail = emails.find((e: any) => e.primary && e.verified)
      email = primaryEmail?.email || null
    } else {
      throw new ValidationError('Unsupported OAuth provider')
    }

    const idField = provider === 'google' ? 'googleId' : 'githubId'
    let user = await UserRepository.findOne({ [idField]: providerId })

    if (!user && email) {
      user = await UserRepository.findOne({ email })
      if (user) {
        await UserRepository.updateOAuthId(user._id.toString(), idField, providerId)
      }
    }

    if (!user) {
      const baseUsername = displayName.toLowerCase().replace(/[^a-z0-9_]/g, '').slice(0, 20) || `${provider}user`
      let username = baseUsername
      let counter = 1
      while (await UserRepository.findOne({ username })) {
        username = `${baseUsername}${counter}`
        counter++
      }

      user = await UserRepository.create({
        username,
        email,
        passwordHash: await bcrypt.hash(crypto.randomBytes(32).toString('hex'), 10),
        displayName,
        avatarUrl,
        [idField]: providerId,
        status: 'online',
      })
    }

    await StatusService.setOnline(user._id.toString())

    const tokens = generateTokens(user._id.toString(), user.username)
    return {
      user: { ...serializeUser(user as any), status: 'online' },
      ...tokens,
    }
  },
}
