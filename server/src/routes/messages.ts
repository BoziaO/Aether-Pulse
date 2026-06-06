import { Router, type IRouter } from 'express'
import { Message, MessageReaction, User } from '@workspace/db'
import { SendMessageBody } from '@workspace/api-zod'
import { isRoomMember } from '../utils/room-auth'
import {
  buildMessagePayload,
  broadcastMessage,
  getReactionsForMessages,
  serializeMessageRow,
} from '../utils/message-helpers'
import { saveUploadedFile } from '../utils/upload'

const router: IRouter = Router()

function requireAuth(req: any, res: any): string | null {
  const userId = req.user?.userId
  if (!userId) {
    res.status(401).json({ error: 'Not authenticated' })
    return null
  }
  return userId
}

router.get('/rooms/:roomId/messages', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const before = req.query.before ? String(req.query.before) : null
  const limit = Math.min(Number(req.query.limit) || 50, 100)

  const query: any = { roomId: rawId }
  if (before) {
    query._id = { $lt: before }
  }

  const rows = await Message.find(query).sort({ createdAt: -1 }).limit(limit).lean()
  const ordered = rows.reverse()
  const messageIds = ordered.map((r) => r._id.toString())
  const reactionsMap = await getReactionsForMessages(messageIds)

  const replyIds = ordered
    .map((r) => r.replyToId?.toString())
    .filter((id): id is string => id != null)
  const replyDocs = replyIds.length ? await Message.find({ _id: { $in: replyIds } }).lean() : []
  const replyMap = new Map(replyDocs.map((r) => [r._id.toString(), r]))

  const userIds = [...new Set(ordered.map((r) => r.userId.toString()))]
  const users = await User.find({ _id: { $in: userIds } }).lean()
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  const messages = ordered.map((r) => {
    const msgId = r._id.toString()
    const user = userMap.get(r.userId.toString())
    const parent = r.replyToId ? replyMap.get(r.replyToId.toString()) : null
    return serializeMessageRow(
      r as any,
      user,
      reactionsMap.get(msgId) ?? [],
      parent
        ? {
            id: parent._id.toString(),
            content: parent.isDeleted ? 'Message deleted' : parent.content,
            userId: parent.userId.toString(),
            isDeleted: parent.isDeleted,
          }
        : null
    )
  })

  res.json(messages)
})

router.get('/rooms/:roomId/messages/search', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  const q = String(req.query.q ?? '').trim()
  if (!q || q.length < 2) {
    res.status(400).json({ error: 'Query must be at least 2 characters' })
    return
  }
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const rows = await Message.find({
    roomId: rawId,
    isDeleted: false,
    type: 'text',
    content: { $regex: q, $options: 'i' },
  })
    .sort({ createdAt: -1 })
    .limit(25)
    .lean()

  const ordered = rows.reverse()
  const messageIds = ordered.map((r) => r._id.toString())
  const reactionsMap = await getReactionsForMessages(messageIds)
  const userIds = [...new Set(ordered.map((r) => r.userId.toString()))]
  const users = await User.find({ _id: { $in: userIds } }).lean()
  const userMap = new Map(users.map((u) => [u._id.toString(), u]))

  res.json(
    ordered.map((r) =>
      serializeMessageRow(
        r as any,
        userMap.get(r.userId.toString()),
        reactionsMap.get(r._id.toString()) ?? []
      )
    )
  )
})

router.post('/rooms/:roomId/messages', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const parsed = SendMessageBody.safeParse(req.body)
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message })
    return
  }

  const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null

  const msg = await Message.create({
    roomId: rawId,
    userId,
    content: parsed.data.content.trim(),
    type: parsed.data.type ?? 'text',
    replyToId: replyToId || undefined,
  })

  const result = await buildMessagePayload(msg._id.toString())
  if (result) {
    broadcastMessage(req.app.get('io'), rawId, 'new-message', result)
  }

  res.status(201).json(result)
})

router.patch('/rooms/:roomId/messages/:messageId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId
  const content = String(req.body.content ?? '').trim()

  if (!content) {
    res.status(400).json({ error: 'Content is required' })
    return
  }

  const existing = await Message.findOne({ _id: messageId, roomId: rawId })
  if (!existing) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (existing.userId.toString() !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }
  if (existing.type !== 'text') {
    res.status(400).json({ error: 'Cannot edit this message type' })
    return
  }

  await Message.findByIdAndUpdate(messageId, { content, editedAt: new Date() })

  const result = await buildMessagePayload(messageId)
  if (result) {
    broadcastMessage(req.app.get('io'), rawId, 'message-updated', result)
  }
  res.json(result)
})

router.delete('/rooms/:roomId/messages/:messageId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId

  const existing = await Message.findOne({ _id: messageId, roomId: rawId })
  if (!existing) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (existing.userId.toString() !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  await Message.findByIdAndUpdate(messageId, { isDeleted: true, content: '' })

  const result = await buildMessagePayload(messageId)
  if (result) {
    broadcastMessage(req.app.get('io'), rawId, 'message-updated', result)
  }
  res.json(result)
})

router.post('/rooms/:roomId/messages/:messageId/reactions', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId

  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId
  const emoji = String(req.body.emoji ?? '').trim()

  if (!emoji) {
    res.status(400).json({ error: 'Emoji is required' })
    return
  }

  const existing = await Message.findOne({ _id: messageId, roomId: rawId })
  if (!existing) {
    res.status(404).json({ error: 'Message not found' })
    return
  }

  const reaction = await MessageReaction.findOne({ messageId, userId, emoji })
  if (reaction) {
    await MessageReaction.findByIdAndDelete(reaction._id)
  } else {
    await MessageReaction.create({ messageId, userId, emoji })
  }

  const result = await buildMessagePayload(messageId)
  if (result) {
    broadcastMessage(req.app.get('io'), rawId, 'message-updated', result)
  }
  res.json(result)
})

router.post('/rooms/:roomId/upload', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
  if (!(await isRoomMember(rawId, userId))) {
    res.status(403).json({ error: 'Not a room member' })
    return
  }

  const dataUrl = String(req.body.dataUrl ?? '')
  const fileName = String(req.body.fileName ?? 'file')
  const caption = String(req.body.caption ?? '').trim()
  const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null

  const saved = saveUploadedFile(`room-${rawId}`, dataUrl, fileName)
  if (!saved) {
    res.status(400).json({ error: 'Invalid or too large file (max 10MB)' })
    return
  }

  const msg = await Message.create({
    roomId: rawId,
    userId,
    content: caption || saved.name,
    type: 'file',
    attachmentUrl: saved.url,
    attachmentName: saved.name,
    attachmentMime: saved.mime,
    replyToId: replyToId || undefined,
  })

  const result = await buildMessagePayload(msg._id.toString())
  if (result) {
    broadcastMessage(req.app.get('io'), rawId, 'new-message', result)
  }
  res.status(201).json(result)
})

export default router
