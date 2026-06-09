import { Router, type IRouter } from 'express'
import { User, Friendship } from '@workspace/db'

import { getFriendship, friendshipStatusFor } from '../utils/friend-helpers'
import { serializeUser } from '../utils/serialize-user'

const router: IRouter = Router()

function notifyFriendshipUpdated(req: any, userA: string, userB: string) {
  try {
    const io = req.app.get('io')
    if (!io) return
    io.to(`user:${userA}`).emit('friendship-updated')
    io.to(`user:${userB}`).emit('friendship-updated')
  } catch (err) {
    console.error('Error emitting friendship updated event:', err)
  }
}

function requireAuth(req: any, res: any): string | null {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  return userId
}

router.get('/friends', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rows = await Friendship.find({
    $or: [{ requesterId: userId }, { addresseeId: userId }],
  }).lean()

  const otherIds = rows.map((r) =>
    r.requesterId.toString() === userId ? r.addresseeId.toString() : r.requesterId.toString()
  )
  const users = otherIds.length ? await User.find({ _id: { $in: otherIds } }).lean() : []
  const userMap = new Map(users.map((u) => [u._id.toString(), serializeUser(u as any)]))

  const friends = rows
    .filter((r) => r.status === 'accepted')
    .map((r) => {
      const oid =
        r.requesterId.toString() === userId ? r.addresseeId.toString() : r.requesterId.toString()
      return { user: userMap.get(oid), since: r.createdAt.toISOString() }
    })
    .filter((f) => f.user)

  const incoming = rows
    .filter((r) => r.status === 'pending' && r.addresseeId.toString() === userId)
    .map((r) => ({
      user: userMap.get(r.requesterId.toString()),
      requestId: r._id.toString(),
      createdAt: r.createdAt.toISOString(),
    }))
    .filter((r) => r.user)

  const outgoing = rows
    .filter((r) => r.status === 'pending' && r.requesterId.toString() === userId)
    .map((r) => ({
      user: userMap.get(r.addresseeId.toString()),
      requestId: r._id.toString(),
      createdAt: r.createdAt.toISOString(),
    }))
    .filter((r) => r.user)

  res.json({ friends, incoming, outgoing })
})

router.get('/friends/search', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const q = String(req.query.q ?? '').trim()
  if (q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' })
    return
  }

  const users = await User.find({
    _id: { $ne: userId },
    $or: [
      { username: { $regex: q, $options: 'i' } },
      { displayName: { $regex: q, $options: 'i' } },
    ],
  })
    .limit(20)
    .lean()

  const results = await Promise.all(
    users.map(async (u) => {
      const friendship = await getFriendship(userId, u._id.toString())
      return {
        user: serializeUser(u as any),
        status: friendshipStatusFor(friendship, userId),
      }
    })
  )

  res.json(results.filter((r) => r.status !== 'blocked'))
})

router.post('/friends/request', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const targetId = String(req.body.userId ?? '')
  if (!targetId || targetId === userId) {
    res.status(400).json({ error: 'Invalid user' })
    return
  }

  const target = await User.findById(targetId).lean()
  if (!target) {
    res.status(404).json({ error: 'User not found' })
    return
  }

  const existing = await getFriendship(userId, targetId)
  if (existing) {
    if (existing.status === 'accepted') {
      res.status(409).json({ error: 'Already friends' })
      return
    }
    if (existing.status === 'pending') {
      if (existing.addresseeId.toString() === userId) {
        await Friendship.findByIdAndUpdate(existing._id, { status: 'accepted' })
        req.app.get('io')?.to(`user:${targetId}`).emit('friend-accepted', { userId })
        notifyFriendshipUpdated(req, userId, targetId)
        res.json({ status: 'accepted', user: serializeUser(target as any) })
        return
      }
      res.status(409).json({ error: 'Request already sent' })
      return
    }
    if (existing.status === 'blocked') {
      res.status(403).json({ error: 'Cannot send request' })
      return
    }
  }

  await Friendship.create({ requesterId: userId, addresseeId: targetId, status: 'pending' })

  const requester = await User.findById(userId).lean()
  if (requester) {
    req.app
      .get('io')
      ?.to(`user:${targetId}`)
      .emit('friend-request', { user: serializeUser(requester as any) })
    notifyFriendshipUpdated(req, userId, targetId)
  }

  res.status(201).json({ status: 'pending', user: serializeUser(target as any) })
})

router.post('/friends/accept', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const targetId = String(req.body.userId ?? '')
  const existing = await getFriendship(userId, targetId)
  if (!existing || existing.status !== 'pending' || existing.addresseeId.toString() !== userId) {
    res.status(404).json({ error: 'No pending request' })
    return
  }

  await Friendship.findByIdAndUpdate(existing._id, { status: 'accepted' })

  const friend = await User.findById(targetId).lean()
  req.app.get('io')?.to(`user:${targetId}`).emit('friend-accepted', { userId })
  notifyFriendshipUpdated(req, userId, targetId)

  res.json({ status: 'accepted', user: friend ? serializeUser(friend as any) : null })
})

router.post('/friends/reject', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const targetId = String(req.body.userId ?? '')
  const existing = await getFriendship(userId, targetId)
  if (!existing || existing.status !== 'pending' || existing.addresseeId.toString() !== userId) {
    res.status(404).json({ error: 'No pending request' })
    return
  }

  await Friendship.findByIdAndDelete(existing._id)
  notifyFriendshipUpdated(req, userId, targetId)
  res.json({ ok: true })
})

router.delete('/friends/:otherUserId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const otherId = Array.isArray(req.params.otherUserId)
    ? req.params.otherUserId[0]
    : req.params.otherUserId

  const existing = await getFriendship(userId, otherId)
  if (!existing) {
    res.status(404).json({ error: 'Not found' })
    return
  }

  await Friendship.findByIdAndDelete(existing._id)
  notifyFriendshipUpdated(req, userId, otherId)
  res.json({ ok: true })
})

router.post('/friends/block', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const targetId = String(req.body.userId ?? '')
  if (!targetId || targetId === userId) {
    res.status(400).json({ error: 'Invalid user' })
    return
  }

  const existing = await getFriendship(userId, targetId)
  if (existing) {
    await Friendship.findByIdAndDelete(existing._id)
  }

  await Friendship.create({ requesterId: userId, addresseeId: targetId, status: 'blocked' })
  notifyFriendshipUpdated(req, userId, targetId)
  res.json({ ok: true })
})

router.get('/friends/status/:otherUserId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const otherId = Array.isArray(req.params.otherUserId)
    ? req.params.otherUserId[0]
    : req.params.otherUserId
  const existing = await getFriendship(userId, otherId)
  res.json({ status: friendshipStatusFor(existing, userId) })
})

export default router
