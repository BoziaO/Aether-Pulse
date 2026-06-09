import { randomBytes } from 'crypto'
import { Router, type IRouter } from 'express'
import { CreateRoomBody, JoinRoomBody } from '@workspace/api-zod'
import { User, Room, RoomMember, Message } from '@workspace/db'

import { isRoomMember } from '../utils/room-auth'
import { serializeUser } from '../utils/serialize-user'

const router: IRouter = Router()

function requireAuth(req: any, res: any): string | null {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  return userId
}

async function getRoomWithMembers(roomId: string) {
  const room = await Room.findById(roomId).lean()
  if (!room) return null

  const memberRows = await RoomMember.find({ roomId }).populate('userId').lean()
  const members = memberRows
    .map((r: any) => (r.userId ? serializeUser(r.userId) : null))
    .filter(Boolean)

  return {
    id: room._id.toString(),
    name: room.name,
    inviteCode: room.inviteCode,
    ownerId: room.ownerId.toString(),
    quality: room.quality,
    isActive: room.isActive,
    memberCount: members.length,
    members,
    createdAt: room.createdAt.toISOString(),
    updatedAt: room.updatedAt.toISOString(),
  }
}

async function logRoomEntry(req: any, roomId: string, userId: string) {
  const existing = await RoomMember.findOne({ roomId, userId })
  if (!existing) {
    await RoomMember.create({ roomId, userId })
    const user = await User.findById(userId).lean()
    if (user) {
      const sysMsg = await Message.create({
        roomId,
        userId,
        content: `${user.displayName} joined the room`,
        type: 'system',
      })
      const payload = {
        id: sysMsg._id.toString(),
        roomId: sysMsg.roomId.toString(),
        userId: sysMsg.userId.toString(),
        content: sysMsg.content,
        type: sysMsg.type,
        replyToId: null,
        editedAt: null,
        isDeleted: false,
        createdAt: sysMsg.createdAt.toISOString(),
        user: serializeUser(user as any),
        reactions: [],
        replyTo: null,
      }
      req.app.get('io')?.to(roomId).emit('new-message', payload)
      req.app
        .get('io')
        ?.to(roomId)
        .emit('room-member-joined', { roomId, user: serializeUser(user as any) })
    }
  }
}

router.get('/rooms', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const memberRooms = await RoomMember.find({ userId }).lean()
  const roomIds = memberRooms.map((r) => r.roomId.toString())
  if (roomIds.length === 0) {
    res.json([])
    return
  }

  const rooms = await Promise.all(roomIds.map(getRoomWithMembers))
  res.json(rooms.filter(Boolean))
})

router.post('/rooms', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const parsed = CreateRoomBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const inviteCode = randomBytes(4).toString('hex').toUpperCase()
  const room = await Room.create({
    name: parsed.data.name,
    inviteCode,
    ownerId: userId,
    quality: parsed.data.quality ?? '1080p',
  })

  await RoomMember.create({ roomId: room._id.toString(), userId })

  const result = await getRoomWithMembers(room._id.toString())
  if (!result) {
    res.status(500).json({ error: 'Failed to load newly created room' })
    return
  }
  res.status(201).json(result)
})

router.get('/rooms/:roomId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId

  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const room = await getRoomWithMembers(rawId)
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  res.json(room)
})

router.patch('/rooms/:roomId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  const room = await Room.findById(rawId)

  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.ownerId.toString() !== userId) {
    res.status(403).json({ error: 'Only the room owner can update settings' })
    return
  }

  const updates: Partial<{ name: string; quality: string }> = {}
  if (typeof req.body.name === 'string' && req.body.name.trim()) {
    updates.name = req.body.name.trim().slice(0, 64)
  }
  const qualities = ['360p', '480p', '720p', '1080p', '1440p']
  if (typeof req.body.quality === 'string' && qualities.includes(req.body.quality)) {
    updates.quality = req.body.quality
  }

  if (Object.keys(updates).length === 0) {
    res.status(400).json({ error: 'No valid fields to update' })
    return
  }

  await Room.findByIdAndUpdate(rawId, updates)
  const result = await getRoomWithMembers(rawId)
  if (!result) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  req.app.get('io')?.to(rawId).emit('room-updated', result)
  res.json(result)
})

router.delete('/rooms/:roomId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  const room = await Room.findById(rawId)
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.ownerId.toString() !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  req.app.get('io')?.to(rawId).emit('room-deleted', { roomId: rawId })

  await Room.findByIdAndDelete(rawId)
  await RoomMember.deleteMany({ roomId: rawId })
  await Message.deleteMany({ roomId: rawId })
  res.sendStatus(204)
})

router.post('/rooms/join-by-code', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const parsed = JoinRoomBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const room = await Room.findOne({ inviteCode: parsed.data.inviteCode })
  if (!room) {
    res.status(404).json({ error: 'Invalid invite code — room not found' })
    return
  }

  await logRoomEntry(req, room._id.toString(), userId)

  const result = await getRoomWithMembers(room._id.toString())
  if (!result) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  res.json(result)
})

router.post('/rooms/:roomId/join', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId

  const parsed = JoinRoomBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const room = await Room.findById(rawId)
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.inviteCode !== parsed.data.inviteCode) {
    res.status(403).json({ error: 'Invalid invite code' })
    return
  }

  await logRoomEntry(req, rawId, userId)

  const result = await getRoomWithMembers(rawId)
  if (!result) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  res.json(result)
})

router.post('/rooms/:roomId/leave', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  await RoomMember.deleteOne({ roomId: rawId, userId })

  req.app.get('io')?.to(rawId).emit('room-member-left', { roomId: rawId, userId })
  res.json({ ok: true })
})

router.get('/rooms/:roomId/activity', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId

  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const memberCount = await RoomMember.countDocuments({ roomId: rawId })
  const messageCount = await Message.countDocuments({ roomId: rawId })
  const recentMessages = await Message.find({ roomId: rawId, type: 'system' })
    .sort({ createdAt: -1 })
    .limit(10)
    .lean()

  res.json({
    roomId: rawId,
    memberCount,
    messageCount,
    events: recentMessages.map((m) => ({
      type: m.type,
      description: m.content,
      userId: m.userId.toString(),
      createdAt: m.createdAt.toISOString(),
    })),
  })
})

export default router
