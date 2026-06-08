import { createServer } from 'http'
import { Server as SocketIOServer, type Socket } from 'socket.io'
import app from './app'
import { logger } from './utils/logger'
import {
  connectDb,
  Room,
  Message,
  User,
  DmMessage,
  DmConversation,
  DmParticipant,
} from '@workspace/db'
import { isRoomMember } from './utils/room-auth'
import { buildMessagePayload, broadcastMessage } from './utils/message-helpers'
import { buildDmMessagePayload, isDmParticipant } from './utils/dm-helpers'
import { serializeUser } from './utils/serialize-user'
import { verifyToken } from './middleware/auth'

const rawPort = process.env['PORT']
if (!rawPort) throw new Error('PORT environment variable is required but was not provided.')
const port = Number(rawPort)
if (Number.isNaN(port) || port <= 0) throw new Error(`Invalid PORT value: "${rawPort}"`)

// Connect to MongoDB before starting the HTTP server
await connectDb()
logger.info('Connected to MongoDB successfully')

const httpServer = createServer(app)

const io = new SocketIOServer(httpServer, {
  cors: { origin: true, credentials: true },
  path: '/api/socket.io',
})

app.set('io', io)

const redisUrl = process.env['REDIS_URL']
if (redisUrl) {
  logger.info('REDIS_URL is set. Configuring Socket.io Redis adapter...')
  try {
    const { createAdapter } = await import('@socket.io/redis-adapter')
    const { default: Redis } = await import('ioredis')
    const pubClient = new Redis(redisUrl)
    const subClient = pubClient.duplicate()
    io.adapter(createAdapter(pubClient, subClient))
    logger.info('Socket.io Redis adapter successfully bound')
  } catch (err) {
    logger.error(
      { err },
      'Failed to configure Socket.io Redis adapter, falling back to in-memory adapter'
    )
  }
} else {
  logger.info('REDIS_URL not set. Running Socket.io with default in-memory adapter')
}

interface RoomUser {
  userId: string
  socketId: string
}

const roomUsers = new Map<string, RoomUser[]>()
const callUsers = new Map<string, RoomUser[]>()

function addUserSocket(list: RoomUser[], userId: string, socketId: string) {
  if (!list.some((u) => u.socketId === socketId)) {
    list.push({ userId, socketId })
  }
}

async function setRoomActive(roomId: string, active: boolean) {
  await Room.findByIdAndUpdate(roomId, { isActive: active })
  io.emit('room-activity-changed', { roomId, isActive: active })
}

async function updateRoomActiveState(roomId: string) {
  const callers = callUsers.get(roomId) ?? []
  await setRoomActive(roomId, callers.length > 0)
}

async function insertSystemMessage(roomId: string, userId: string, content: string) {
  const msg = await Message.create({ roomId, userId, content, type: 'system' })
  const user = await User.findById(userId).lean()
  const payload = {
    id: msg._id.toString(),
    roomId: msg.roomId.toString(),
    userId: msg.userId.toString(),
    content: msg.content,
    type: msg.type,
    replyToId: null,
    editedAt: null,
    isDeleted: false,
    createdAt: msg.createdAt.toISOString(),
    user: user ? serializeUser(user as any) : null,
    reactions: [],
    replyTo: null,
  }
  broadcastMessage(io, roomId, 'new-message', payload)
}

const socketRateLimits = new Map<string, number[]>()

function getAuthedUserId(socket: Socket): string | null {
  const id = socket.data.userId
  return typeof id === 'string' && id.length > 0 ? id : null
}

io.use((socket, next) => {
  const token =
    socket.handshake.auth.token || socket.handshake.headers['authorization']?.split(' ')[1]

  if (!token) {
    next(new Error('Authentication required'))
    return
  }

  const payload = verifyToken(token)
  if (!payload) {
    next(new Error('Invalid or expired token'))
    return
  }

  socket.data.userId = payload.userId
  next()
})

io.on('connection', (socket) => {
  const authedUserId = getAuthedUserId(socket)!
  socket.join(`user:${authedUserId}`)
  logger.info({ socketId: socket.id, userId: authedUserId }, 'Socket connected')

  // Rate limiting middleware for incoming client events
  socket.use(([event, ...args], next) => {
    const limitEvents = ['chat-message', 'dm-message', 'join-room', 'join-call']
    if (!limitEvents.includes(event)) {
      return next()
    }

    const now = Date.now()
    const timestamps = socketRateLimits.get(socket.id) ?? []
    const recent = timestamps.filter((t) => now - t < 1000)

    if (recent.length >= 5) {
      socket.emit('error', { message: 'Rate limit exceeded. Please slow down.' })
      return
    }

    recent.push(now)
    socketRateLimits.set(socket.id, recent)
    next()
  })

  socket.on('join-room', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      try {
        if (!(await isRoomMember(roomId, userId))) {
          socket.emit('error', { message: 'Not a room member' })
          return
        }
      } catch (e) {
        logger.error({ err: e, roomId, userId }, 'Error checking room membership')
        socket.emit('error', { message: 'Failed to join room' })
        return
      }

      socket.join(roomId)
      if (!roomUsers.has(roomId)) roomUsers.set(roomId, [])
      const users = roomUsers.get(roomId)!
      const wasOnline = users.some((u) => u.userId === userId)
      addUserSocket(users, userId, socket.id)

      const roomUserIds = Array.from(new Set(roomUsers.get(roomId)!.map((u) => u.userId)))
      socket.emit('room-users', { userIds: roomUserIds })
      if (!wasOnline) {
        socket.to(roomId).emit('user-joined', { userId, socketId: socket.id })
      }
      logger.info({ socketId: socket.id, roomId, userId }, 'User joined room')
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in join-room')
    }
  })

  socket.on('leave-room', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      socket.leave(roomId)
      const users = roomUsers.get(roomId) ?? []
      const remaining = users.filter((u) => u.socketId !== socket.id)
      roomUsers.set(roomId, remaining)
      const isStillOnline = remaining.some((u) => u.userId === userId)
      if (!isStillOnline) {
        socket.to(roomId).emit('user-left', { userId, socketId: socket.id })
      }

      const callers = callUsers.get(roomId) ?? []
      const remainingCallers = callers.filter((u) => u.socketId !== socket.id)
      callUsers.set(roomId, remainingCallers)
      const isStillInCall = remainingCallers.some((u) => u.userId === userId)
      if (!isStillInCall) {
        socket.to(roomId).emit('call-user-left', { userId, socketId: socket.id })
      }
      await updateRoomActiveState(roomId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in leave-room')
    }
  })

  socket.on('join-call', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      try {
        if (!(await isRoomMember(roomId, userId))) {
          socket.emit('error', { message: 'Not a room member' })
          return
        }
      } catch (e) {
        logger.error({ err: e, roomId, userId }, 'Error checking room membership')
        socket.emit('error', { message: 'Failed to join call' })
        return
      }

      if (!callUsers.has(roomId)) callUsers.set(roomId, [])
      const callers = callUsers.get(roomId)!
      const wasInCall = callers.some((u) => u.userId === userId)
      addUserSocket(callers, userId, socket.id)

      socket.emit('call-users', { users: callers.filter((u) => u.userId !== userId) })
      if (!wasInCall) {
        socket.to(roomId).emit('call-user-joined', { userId, socketId: socket.id })
        const user = await User.findById(userId).lean()
        if (user) {
          await insertSystemMessage(roomId, userId, `${user.displayName} joined the voice channel`)
        }
      }
      await updateRoomActiveState(roomId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in join-call')
    }
  })

  socket.on('leave-call', async ({ roomId, userId }: { roomId: string; userId: string }) => {
    try {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      const callers = callUsers.get(roomId) ?? []
      const remainingCallers = callers.filter((u) => u.socketId !== socket.id)
      callUsers.set(roomId, remainingCallers)
      const isStillInCall = remainingCallers.some((u) => u.userId === userId)
      if (!isStillInCall) {
        socket.to(roomId).emit('call-user-left', { userId, socketId: socket.id })
      }
      await updateRoomActiveState(roomId)
    } catch (e) {
      logger.error({ err: e, roomId, userId }, 'Error in leave-call')
    }
  })

  socket.on(
    'offer',
    ({ to, offer, fromUserId }: { to: string; offer: unknown; fromUserId?: string }) => {
      if (!fromUserId || fromUserId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      io.to(to).emit('offer', { from: socket.id, fromUserId: authedUserId, offer })
    }
  )

  socket.on(
    'answer',
    ({ to, answer, fromUserId }: { to: string; answer: unknown; fromUserId?: string }) => {
      if (!fromUserId || fromUserId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      io.to(to).emit('answer', { from: socket.id, fromUserId: authedUserId, answer })
    }
  )

  socket.on(
    'ice-candidate',
    ({ to, candidate, fromUserId }: { to: string; candidate: unknown; fromUserId?: string }) => {
      if (!fromUserId || fromUserId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      io.to(to).emit('ice-candidate', { from: socket.id, fromUserId: authedUserId, candidate })
    }
  )

  socket.on(
    'chat-message',
    async ({
      roomId,
      userId,
      content,
      replyToId,
    }: {
      roomId: string
      userId: string
      content: string
      replyToId?: string
    }) => {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      if (!content?.trim()) {
        socket.emit('error', { message: 'Message content cannot be empty' })
        return
      }
      try {
        if (!(await isRoomMember(roomId, userId))) {
          socket.emit('error', { message: 'Not a room member' })
          return
        }
      } catch (e) {
        logger.error({ err: e, roomId, userId }, 'Error checking room membership for message')
        socket.emit('error', { message: 'Failed to send message' })
        return
      }

      try {
        const msg = await Message.create({
          roomId,
          userId,
          content: content.trim(),
          type: 'text',
          replyToId: replyToId || undefined,
        })

        const payload = await buildMessagePayload(msg._id.toString())
        if (payload) broadcastMessage(io, roomId, 'new-message', payload)
      } catch (e) {
        logger.error({ err: e }, 'Failed to save chat message')
      }
    }
  )

  socket.on(
    'user-typing',
    async ({ roomId, userId, isTyping }: { roomId: string; userId: string; isTyping: boolean }) => {
      if (!roomId || !userId) {
        socket.emit('error', { message: 'Invalid room or user ID' })
        return
      }
      if (userId !== authedUserId) {
        socket.emit('error', { message: 'Unauthorized' })
        return
      }
      try {
        if (!(await isRoomMember(roomId, userId))) {
          socket.emit('error', { message: 'Not a room member' })
          return
        }
        socket.to(roomId).emit('user-typing', { userId, isTyping })
      } catch (e) {
        logger.error({ err: e, roomId, userId }, 'Error handling user-typing')
      }
    }
  )

  socket.on('user-status', async ({ userId, status }: { userId: string; status: string }) => {
    if (!userId || userId !== authedUserId) {
      socket.emit('error', { message: 'Unauthorized' })
      return
    }
    try {
      const updated = await User.findByIdAndUpdate(userId, { status }, { new: true }).lean()
      if (updated) {
        const serialized = serializeUser(updated as any, { viewerId: userId })
        socket.broadcast.emit('user-status-changed', { userId, status })
        io.emit('user-profile-updated', serialized)
      }
    } catch (e) {
      logger.error({ err: e, userId }, 'Error updating status')
    }
  })

  socket.on('join-dm', async ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) {
      socket.emit('error', { message: 'Invalid conversation ID' })
      return
    }
    try {
      if (!(await isDmParticipant(conversationId, authedUserId))) {
        socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
        return
      }
      socket.join(`dm:${conversationId}`)
    } catch (e) {
      logger.error({ err: e, conversationId, userId: authedUserId }, 'Error joining DM')
      socket.emit('error', { message: 'Failed to join conversation' })
    }
  })

  socket.on('leave-dm', ({ conversationId }: { conversationId: string }) => {
    if (!conversationId) {
      socket.emit('error', { message: 'Invalid conversation ID' })
      return
    }
    socket.leave(`dm:${conversationId}`)
  })

  socket.on(
    'dm-typing',
    async ({ conversationId, isTyping }: { conversationId: string; isTyping: boolean }) => {
      if (!conversationId) {
        socket.emit('error', { message: 'Invalid conversation ID' })
        return
      }
      try {
        if (!(await isDmParticipant(conversationId, authedUserId))) {
          socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
          return
        }
        socket.to(`dm:${conversationId}`).emit('dm-typing', {
          conversationId,
          userId: authedUserId,
          isTyping: !!isTyping,
        })
      } catch (e) {
        logger.error({ err: e, conversationId, userId: authedUserId }, 'Error in dm-typing')
      }
    }
  )

  socket.on(
    'dm-message',
    async ({
      conversationId,
      content,
      replyToId,
    }: {
      conversationId: string
      content: string
      replyToId?: string
    }) => {
      if (!conversationId || !content?.trim()) {
        socket.emit('error', { message: 'Invalid conversation ID or empty content' })
        return
      }
      try {
        if (!(await isDmParticipant(conversationId, authedUserId))) {
          socket.emit('error', { message: 'Unauthorized — not a participant of this conversation' })
          return
        }
      } catch (e) {
        logger.error(
          { err: e, conversationId, userId: authedUserId },
          'Error checking DM membership'
        )
        socket.emit('error', { message: 'Failed to send message' })
        return
      }

      try {
        const msg = await DmMessage.create({
          conversationId,
          userId: authedUserId,
          content: content.trim(),
          type: 'text',
          replyToId: replyToId || undefined,
        })

        await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })

        const payload = await buildDmMessagePayload(msg._id.toString())
        if (payload) io.to(`dm:${conversationId}`).emit('new-dm-message', payload)
      } catch (e) {
        logger.error({ err: e }, 'Failed to save DM')
      }
    }
  )

  socket.on('disconnect', async () => {
    socketRateLimits.delete(socket.id)

    for (const [roomId, users] of roomUsers.entries()) {
      const user = users.find((u) => u.socketId === socket.id)
      if (user) {
        const remaining = users.filter((u) => u.socketId !== socket.id)
        roomUsers.set(roomId, remaining)
        const isStillOnline = remaining.some((u) => u.userId === user.userId)
        if (!isStillOnline) {
          socket.to(roomId).emit('user-left', { userId: user.userId, socketId: socket.id })
        }
      }
    }

    for (const [roomId, users] of callUsers.entries()) {
      const user = users.find((u) => u.socketId === socket.id)
      if (user) {
        const remaining = users.filter((u) => u.socketId !== socket.id)
        callUsers.set(roomId, remaining)
        const isStillInCall = remaining.some((u) => u.userId === user.userId)
        if (!isStillInCall) {
          socket.to(roomId).emit('call-user-left', { userId: user.userId, socketId: socket.id })
        }
        await updateRoomActiveState(roomId)
      }
    }
    logger.info({ socketId: socket.id }, 'Socket disconnected')
  })
})

httpServer.listen(port, () => {
  logger.info({ port }, 'Server listening')
})
