import fs from 'node:fs'
import path from 'node:path'
import { Router, type IRouter } from 'express'
import sharp from 'sharp'
import { UpdateUserBody } from '@workspace/api-zod'
import { User, Friendship, Message, MessageReaction, mongoose } from '@workspace/db'

import { serializeUser } from '../utils/serialize-user'

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

async function areFriendsLocal(userA: string, userB: string): Promise<boolean> {
  try {
    const row = await Friendship.findOne({
      status: 'accepted',
      $or: [
        { requesterId: userA, addresseeId: userB },
        { requesterId: userB, addresseeId: userA },
      ],
    }).lean()
    return Boolean(row)
  } catch {
    return false
  }
}

router.get('/users/:userId', async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId

  const user = await User.findById(rawId).lean()
  if (!user) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const viewerId = (req as any).user?.userId ?? null
  const privacy = user.profilePrivacy ?? 'public'
  const isOwn = viewerId === user._id.toString()

  if (privacy === 'private' && !isOwn) {
    res.status(403).json({ error: 'This profile is private.' })
    return
  }

  const isFriend =
    viewerId != null && !isOwn ? await areFriendsLocal(viewerId, user._id.toString()) : false

  // Track profile views (not for own profile)
  if (!isOwn && viewerId != null) {
    User.findByIdAndUpdate(user._id, { $inc: { profileViews: 1 } })
      .then(() => {})
      .catch(() => {})
  }

  res.json(serializeUser(user as any, { viewerId, isFriend }))
})

router.get('/users/:userId/stats', async (req, res): Promise<void> => {
  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId

  try {
    const userObjectId = new mongoose.Types.ObjectId(rawId)
    const msgCount = await Message.countDocuments({ userId: rawId, isDeleted: false })
    const friendCount = await Friendship.countDocuments({
      status: 'accepted',
      $or: [{ requesterId: rawId }, { addresseeId: rawId }],
    })

    const topReactions = await MessageReaction.aggregate([
      { $match: { userId: userObjectId } },
      { $group: { _id: '$emoji', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 5 },
    ])

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const activityAgg = await Message.aggregate([
      {
        $match: {
          userId: userObjectId,
          isDeleted: false,
          createdAt: { $gte: sevenDaysAgo },
        },
      },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
          cnt: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])

    const activityMap = new Map(activityAgg.map((a: any) => [a._id, a.cnt]))
    const activityByDay = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000)
      const key = d.toISOString().slice(0, 10)
      activityByDay.push({ date: key, count: activityMap.get(key) ?? 0 })
    }

    res.json({
      messageCount: msgCount,
      friendCount,
      topReactions: topReactions.map((r: any) => ({ emoji: r._id, count: r.count })),
      activityByDay,
    })
  } catch {
    res.status(500).json({ error: 'Failed to load stats' })
  }
})

router.post('/users/:userId/avatar', async (req, res): Promise<void> => {
  const sessionUserId = (req as any).user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  if (sessionUserId !== rawId) {
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

  let buffer = parsedImage.buffer
  const isGif = parsedImage.ext === 'gif'
  if (!isGif) {
    try {
      buffer = await sharp(buffer)
        .resize(512, 512, { fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer()
    } catch {
      // fallback to original buffer
    }
  }

  const mime = isGif ? 'image/gif' : 'image/jpeg'
  const storedDataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  const updated = await User.findByIdAndUpdate(rawId, { avatarUrl: storedDataUrl }, { new: true }).lean()

  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const serialized = serializeUser(updated as any, { viewerId: rawId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json({ avatarUrl: storedDataUrl, user: serialized })
})

router.post('/users/:userId/banner', async (req, res): Promise<void> => {
  const sessionUserId = (req as any).user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
  if (sessionUserId !== rawId) {
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

  let buffer = parsedImage.buffer
  const isGif = parsedImage.ext === 'gif'
  if (!isGif) {
    try {
      buffer = await sharp(buffer)
        .resize(1920, 480, { fit: 'cover', position: 'centre' })
        .jpeg({ quality: 80, mozjpeg: true })
        .toBuffer()
    } catch {
      // fallback to original buffer
    }
  }

  const mime = isGif ? 'image/gif' : 'image/jpeg'
  const storedDataUrl = `data:${mime};base64,${buffer.toString('base64')}`
  const updated = await User.findByIdAndUpdate(rawId, { bannerUrl: storedDataUrl }, { new: true }).lean()

  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }
  const serialized = serializeUser(updated as any, { viewerId: rawId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json({ bannerUrl: storedDataUrl, user: serialized })
})

router.patch('/users/:userId', async (req, res): Promise<void> => {
  const sessionUserId = (req as any).user?.userId
  if (!sessionUserId) {
    res.status(401).json({ error: 'Not authenticated' })
    return
  }

  const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId

  if (sessionUserId !== rawId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  const parsed = UpdateUserBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const updateData = { ...parsed.data } as any

  if (Object.keys(updateData).length === 0) {
    const user = await User.findById(rawId).lean()
    if (!user) {
      res.status(404).json({ error: 'User not found' })
      return
    }
    res.json(serializeUser(user as any, { viewerId: rawId }))
    return
  }

  const updated = await User.findByIdAndUpdate(rawId, updateData, { new: true }).lean()
  if (!updated) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const serialized = serializeUser(updated as any, { viewerId: rawId })
  req.app.get('io')?.emit('user-profile-updated', serialized)
  res.json(serialized)
})

export default router
