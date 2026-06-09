import { Router, type IRouter } from 'express'
import bcrypt from 'bcryptjs'
import { RegisterBody, LoginBody, RefreshBody } from '@workspace/api-zod'
import { User } from '@workspace/db'

import { generateTokens, verifyRefreshToken } from '../middleware/auth'
import { serializeUser } from '../utils/serialize-user'

const router: IRouter = Router()

router.post('/auth/register', async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { username, password, displayName } = parsed.data

  const existing = await User.findOne({ username })
  if (existing) {
    res.status(409).json({ error: 'Username already taken' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await User.create({ username, passwordHash, displayName, status: 'online' })

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.username)

  res.status(201).json({
    user: { ...serializeUser(user), status: 'online' },
    accessToken,
    refreshToken,
  })
})

router.post('/auth/login', async (req, res): Promise<void> => {
  const parsed = LoginBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { username, password } = parsed.data
  const user = await User.findOne({ username })
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  await User.findByIdAndUpdate(user._id, { status: 'online' })

  const { accessToken, refreshToken } = generateTokens(user._id.toString(), user.username)

  res.json({
    user: { ...serializeUser(user), status: 'online' },
    accessToken,
    refreshToken,
  })
})

router.post('/auth/logout', async (req, res): Promise<void> => {
  const userId = (req as any).user?.userId
  if (userId) {
    await User.findByIdAndUpdate(userId, { status: 'offline' })
  }
  res.json({ ok: true })
})

router.get('/auth/me', async (req, res): Promise<void> => {
  const userId = (req as any).user?.userId
  if (!userId) {
    res.json({ user: null })
    return
  }

  const user = await User.findById(userId)
  if (!user) {
    res.json({ user: null })
    return
  }

  res.json({ user: serializeUser(user) })
})

router.post('/auth/refresh', async (req, res): Promise<void> => {
  const parsed = RefreshBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { refreshToken } = parsed.data
  const payload = verifyRefreshToken(refreshToken)

  if (!payload) {
    res.status(401).json({
      error: { message: 'Invalid or expired refresh token', code: 'INVALID_REFRESH_TOKEN' },
    })
    return
  }

  const user = await User.findById(payload.userId)
  if (!user) {
    res.status(401).json({ error: { message: 'User not found', code: 'USER_NOT_FOUND' } })
    return
  }

  const { accessToken, refreshToken: newRefreshToken } = generateTokens(
    user._id.toString(),
    user.username
  )

  res.json({ accessToken, refreshToken: newRefreshToken })
})

export default router
