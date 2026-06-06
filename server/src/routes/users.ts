import { Router, type IRouter } from 'express'
import { eq, or, and, count, desc, gte, sql } from 'drizzle-orm'
import {
  db,
  usersTable,
  friendshipsTable,
  messagesTable,
  messageReactionsTable,
} from '@workspace/db'
import { UpdateUserBody } from '@workspace/api-zod'
import { serializeUser } from '../utils/serialize-user'
import path from 'node:path'
import fs from 'node:fs'

const router: IRouter = Router()

const uploadsDir = path.resolve(process.cwd(), 'uploads')
fs.mkdirSync(uploadsDir, { recursive: true })

function parseImageDataUrl(dataUrl: string): { buffer: Buffer; ext: string } | null {
  const match = /^data:(image\/(?:png|jpeg|jpg|webp|gif));base64,(.+)$/i.exec(dataUrl)
  if (!match) return null
  const mime = match[1].toLowerCase()
  const base64 = match[2]
  const buffer = Buffer.from(base64, 'base64')
  const ext = mime === 'image/jpeg' ? 'jpg' : mime === 'image/jpg' ? 'jpg' : mime.split('/')[1]
  return { buffer, ext }
}

async function areFriends(userA: number, userB: number): Promise<boolean> {
  try {
    const rows = await db
      .select({ id: friendshipsTable.id })
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, 'accepted'),
          or(
            and(eq(friendshipsTable.requesterId, userA), eq(friendshipsTable.addresseeId, userB)),
            and(eq(friendshipsTable.requesterId, userB), eq(friendshipsTable.addresseeId, userA))
          )
        )
      )
      .limit(1)
    return rows.length > 0
  } catch {
    return false
  }
}

router.get('/users/:userId', async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  const userId = parseInt(rawId, 10)
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' })
    return
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId))
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const viewerId = req.user?.userId ?? null
  const privacy = user.profilePrivacy ?? 'public'
  const isOwn = viewerId === userId

  if (privacy === 'private' && !isOwn) {
    res.status(403).json({ error: 'This profile is private.' })
    return
  }

  const isFriend = viewerId != null && !isOwn ? await areFriends(viewerId, userId) : false

  // Track profile views (not for own profile)
  if (!isOwn && viewerId != null) {
    db.update(usersTable)
      .set({ profileViews: (user.profileViews ?? 0) + 1 })
      .where(eq(usersTable.id, userId))
      .then(() => {})
      .catch(() => {})
  }

  res.json(serializeUser(user, { viewerId, isFriend }))
})

router.get('/users/:userId/stats', async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  const userId = parseInt(rawId, 10)
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' })
    return
  }

  try {
    const [msgRow] = await db
      .select({ c: count() })
      .from(messagesTable)
      .where(and(eq(messagesTable.userId, userId), eq(messagesTable.isDeleted, false)))

    const [friendRow] = await db
      .select({ c: count() })
      .from(friendshipsTable)
      .where(
        and(
          eq(friendshipsTable.status, 'accepted'),
          or(eq(friendshipsTable.requesterId, userId), eq(friendshipsTable.addresseeId, userId))
        )
      )

    const topReactions = await db
      .select({ emoji: messageReactionsTable.emoji, cnt: count() })
      .from(messageReactionsTable)
      .where(eq(messageReactionsTable.userId, userId))
      .groupBy(messageReactionsTable.emoji)
      .orderBy(desc(count()))
      .limit(5)

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activity = await db
      .select({
        date: sql<string>`strftime('%Y-%m-%d', datetime(created_at/1000, 'unixepoch'))`,
        cnt: count(),
      })
      .from(messagesTable)
      .where(
        and(
          eq(messagesTable.userId, userId),
          eq(messagesTable.isDeleted, false),
          gte(messagesTable.createdAt, sevenDaysAgo)
        )
      )
      .groupBy(sql`strftime('%Y-%m-%d', datetime(created_at/1000, 'unixepoch'))`)
      .orderBy(sql`strftime('%Y-%m-%d', datetime(created_at/1000, 'unixepoch'))`)

    // Fill in missing days with 0
    const activityMap = new Map(activity.map((a) => [a.date, a.cnt]))
    const activityByDay = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      activityByDay.push({ date: key, count: activityMap.get(key) ?? 0 })
    }

    res.json({
      messageCount: msgRow?.c ?? 0,
      friendCount: friendRow?.c ?? 0,
      topReactions: topReactions.map((r) => ({ emoji: r.emoji, count: r.cnt })),
      activityByDay,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

router.post('/users/:userId/avatar', async (req, res): Promise<void> => {
  const sessionUserId = req.user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  const userId = parseInt(rawId, 10)
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' })
    return
  }
  if (sessionUserId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const dataUrl = (req.body as { dataUrl?: string })?.dataUrl
  if (!dataUrl) {
    res.status(400).json({ error: 'Missing dataUrl' })
    return
  }

  const parsedImage = parseImageDataUrl(dataUrl)
  if (!parsedImage) {
    res.status(400).json({ error: 'Invalid image data' })
    return
  }
  if (parsedImage.buffer.length > 6 * 1024 * 1024) {
    res.status(413).json({ error: 'File too large (max 6MB)' })
    return
  }

  const fileName = `user-${userId}-avatar-${Date.now()}.${parsedImage.ext}`
  fs.writeFileSync(path.join(uploadsDir, fileName), parsedImage.buffer)
  const avatarUrl = `/api/uploads/${fileName}`
  const [updated] = await db
    .update(usersTable)
    .set({ avatarUrl })
    .where(eq(usersTable.id, userId))
    .returning()

  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const serialized = serializeUser(updated, { viewerId: userId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json({ avatarUrl, user: serialized })
})

router.post('/users/:userId/banner', async (req, res): Promise<void> => {
  const sessionUserId = req.user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  const userId = parseInt(rawId, 10)
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' })
    return
  }
  if (sessionUserId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const dataUrl = (req.body as { dataUrl?: string })?.dataUrl
  if (!dataUrl) {
    res.status(400).json({ error: 'Missing dataUrl' })
    return
  }

  const parsedImage = parseImageDataUrl(dataUrl)
  if (!parsedImage) {
    res.status(400).json({ error: 'Invalid image data' })
    return
  }
  if (parsedImage.buffer.length > 6 * 1024 * 1024) {
    res.status(413).json({ error: 'File too large (max 6MB)' })
    return
  }

  const fileName = `user-${userId}-banner-${Date.now()}.${parsedImage.ext}`
  fs.writeFileSync(path.join(uploadsDir, fileName), parsedImage.buffer)
  const bannerUrl = `/api/uploads/${fileName}`
  const [updated] = await db
    .update(usersTable)
    .set({ bannerUrl })
    .where(eq(usersTable.id, userId))
    .returning()

  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const serialized = serializeUser(updated, { viewerId: userId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json({ bannerUrl, user: serialized })
})

router.patch('/users/:userId', async (req, res): Promise<void> => {
  const sessionUserId = req.user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  const userId = parseInt(rawId, 10)
  if (isNaN(userId)) {
    res.status(400).json({ error: 'Invalid user ID' })
    return
  }

  if (sessionUserId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const parsed = UpdateUserBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const updateData = { ...parsed.data } as any
  if (updateData.badges) {
    updateData.badges = JSON.stringify(updateData.badges)
  }

  if (Object.keys(updateData).length === 0) {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.id, userId))
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(serializeUser(user, { viewerId: userId }))
    return
  }

  const [updated] = await db
    .update(usersTable)
    .set(updateData)
    .where(eq(usersTable.id, userId))
    .returning()

  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const serialized = serializeUser(updated, { viewerId: userId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json(serialized)
})

export default router
