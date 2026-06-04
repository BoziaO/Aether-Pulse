import { Router, type IRouter } from 'express'
import { eq, and, count, desc } from 'drizzle-orm'
import { db, usersTable, roomsTable, roomMembersTable, messagesTable } from '@workspace/db'
import { CreateRoomBody, JoinRoomBody } from '@workspace/api-zod'
import { randomBytes } from 'crypto'
import { nanoid } from 'nanoid'
import { serializeUser } from '../utils/serialize-user'
import { isRoomMember } from '../utils/room-auth'
import { broadcastMessage } from '../utils/message-helpers'

const router: IRouter = Router()

function requireAuth(req: any, res: any): number | null {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  return userId
}

async function getRoomWithMembers(roomId: string) {
  const room = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.id, roomId))
    .then((r) => r[0])
  if (!room) return null

  const memberRows = await db
    .select({ user: usersTable })
    .from(roomMembersTable)
    .innerJoin(usersTable, eq(roomMembersTable.userId, usersTable.id))
    .where(eq(roomMembersTable.roomId, roomId))

  const members = memberRows.map((r) => serializeUser(r.user))

  return {
    ...room,
    memberCount: members.length,
    members,
    createdAt: room.createdAt.toISOString(),
  }
}

async function logRoomEntry(req: any, roomId: string, userId: number) {
  await db.transaction(async (tx) => {
    const [existing] = await tx
      .select()
      .from(roomMembersTable)
      .where(and(eq(roomMembersTable.roomId, roomId), eq(roomMembersTable.userId, userId)))

    if (!existing) {
      await tx.insert(roomMembersTable).values({ roomId, userId })
      const [user] = await tx.select().from(usersTable).where(eq(usersTable.id, userId))
      if (user) {
        const [sysMsg] = await tx
          .insert(messagesTable)
          .values({
            roomId,
            userId,
            content: `${user.displayName} joined the room`,
            type: 'system',
          })
          .returning()
        const payload = {
          id: sysMsg.id,
          roomId: sysMsg.roomId,
          userId: sysMsg.userId,
          content: sysMsg.content,
          type: sysMsg.type,
          replyToId: null,
          editedAt: null,
          isDeleted: false,
          createdAt: sysMsg.createdAt.toISOString(),
          user: serializeUser(user),
          reactions: [],
          replyTo: null,
        }
        req.app.get('io')?.to(roomId).emit('new-message', payload)
      }
    }
  })
}

router.get('/rooms', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const memberRooms = await db
    .select({ roomId: roomMembersTable.roomId })
    .from(roomMembersTable)
    .where(eq(roomMembersTable.userId, userId))

  const roomIds = memberRooms.map((r) => r.roomId)
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

  const roomId = nanoid(8)
  const inviteCode = randomBytes(4).toString('hex').toUpperCase()

  const [room] = await db
    .insert(roomsTable)
    .values({
      id: roomId,
      name: parsed.data.name,
      inviteCode,
      ownerId: userId,
      quality: (parsed.data.quality as any) ?? '1080p',
    })
    .returning()

  await db.insert(roomMembersTable).values({ roomId: room.id, userId })

  const result = await getRoomWithMembers(room.id)
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
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, rawId))

  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.ownerId !== userId) {
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

  await db
    .update(roomsTable)
    .set(updates as any)
    .where(eq(roomsTable.id, rawId))
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
  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, rawId))
  if (!room) {
    res.status(404).json({ error: 'Room not found' })
    return
  }
  if (room.ownerId !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  await db.delete(roomsTable).where(eq(roomsTable.id, rawId))
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

  const [room] = await db
    .select()
    .from(roomsTable)
    .where(eq(roomsTable.inviteCode, parsed.data.inviteCode))

  if (!room) {
    res.status(404).json({ error: 'Invalid invite code — room not found' })
    return
  }

  await logRoomEntry(req, room.id, userId)

  const result = await getRoomWithMembers(room.id)
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

  const [room] = await db.select().from(roomsTable).where(eq(roomsTable.id, rawId))
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
  await db
    .delete(roomMembersTable)
    .where(and(eq(roomMembersTable.roomId, rawId), eq(roomMembersTable.userId, userId)))

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

  const [memberCount] = await db
    .select({ count: count() })
    .from(roomMembersTable)
    .where(eq(roomMembersTable.roomId, rawId))

  const [msgCount] = await db
    .select({ count: count() })
    .from(messagesTable)
    .where(eq(messagesTable.roomId, rawId))

  const recentMessages = await db
    .select({
      content: messagesTable.content,
      type: messagesTable.type,
      userId: messagesTable.userId,
      createdAt: messagesTable.createdAt,
    })
    .from(messagesTable)
    .where(and(eq(messagesTable.roomId, rawId), eq(messagesTable.type, 'system')))
    .orderBy(desc(messagesTable.createdAt))
    .limit(10)

  res.json({
    roomId: rawId,
    memberCount: Number(memberCount?.count ?? 0),
    messageCount: Number(msgCount?.count ?? 0),
    events: recentMessages.map((m) => ({
      type: m.type,
      description: m.content,
      userId: m.userId,
      createdAt: m.createdAt.toISOString(),
    })),
  })
})

export default router
