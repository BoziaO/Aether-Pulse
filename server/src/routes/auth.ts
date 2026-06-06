import { Router, type IRouter } from 'express'
import bcrypt from 'bcryptjs'
import { eq } from 'drizzle-orm'
import { db, usersTable } from '@workspace/db'
import { RegisterBody, LoginBody, RefreshBody } from '@workspace/api-zod'
import { serializeUser } from '../utils/serialize-user'
import { generateTokens, verifyRefreshToken, type JwtPayload } from '../middleware/auth'

const router: IRouter = Router()

router.post('/auth/register', async (req, res): Promise<void> => {
  const parsed = RegisterBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const { username, password, displayName } = parsed.data

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.username, username))
  if (existing) {
    res.status(409).json({ error: 'Username already taken' })
    return
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const [user] = await db
    .insert(usersTable)
    .values({ username, passwordHash, displayName, status: 'online' })
    .returning()

  // Generate JWT tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.username)

  // Update user status
  await db.update(usersTable).set({ status: 'online' }).where(eq(usersTable.id, user.id))

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
  const [user] = await db.select().from(usersTable).where(eq(usersTable.username, username))
  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  const valid = await bcrypt.compare(password, user.passwordHash)
  if (!valid) {
    res.status(401).json({ error: 'Invalid credentials' })
    return
  }

  // Update user status
  await db.update(usersTable).set({ status: 'online' }).where(eq(usersTable.id, user.id))

  // Generate JWT tokens
  const { accessToken, refreshToken } = generateTokens(user.id, user.username)

  res.json({
    user: { ...serializeUser(user), status: 'online' },
    accessToken,
    refreshToken,
  })
})

router.post('/auth/logout', async (req, res): Promise<void> => {
  // For JWT, logout is stateless - client should discard tokens
  // We can optionally track tokens in a blacklist (Redis) for immediate invalidation
  const userId = (req as any).user?.userId
  if (userId) {
    await db.update(usersTable).set({ status: 'offline' }).where(eq(usersTable.id, userId))
  }
  res.json({ ok: true })
})

router.get('/auth/me', async (req, res): Promise<void> => {
  const userId = (req as any).user?.userId
  if (!userId) {
    // Returning 200 prevents "failed to load resource 401" noise in the browser console
    // and lets the client treat unauthenticated state as a normal case.
    res.json({ user: null })
    return
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId))
  if (!user) {
    res.json({ user: null })
    return
  }

  res.json({ user: serializeUser(user) })
})

// JWT token refresh endpoint
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
      error: {
        message: 'Invalid or expired refresh token',
        code: 'INVALID_REFRESH_TOKEN',
      },
    })
    return
  }

  // Verify user still exists
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, payload.userId))
  if (!user) {
    res.status(401).json({
      error: {
        message: 'User not found',
        code: 'USER_NOT_FOUND',
      },
    })
    return
  }

  // Generate new token pair
  const { accessToken, refreshToken: newRefreshToken } = generateTokens(user.id, user.username)

  res.json({
    accessToken,
    refreshToken: newRefreshToken,
  })
})

export default router
