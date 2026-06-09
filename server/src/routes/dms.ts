import { Router, type IRouter } from 'express'
import { DmConversation, DmParticipant, DmMessage, User } from '@workspace/db'

import { areFriends } from '../utils/friend-helpers'
import {
  buildDmMessagePayload,
  getOrCreateConversation,
  getOtherParticipant,
  isDmParticipant,
} from '../utils/dm-helpers'
import { saveUploadedFile } from '../utils/upload'
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

function dmRoom(conversationId: string) {
  return `dm:${conversationId}`
}

async function emitDmEvent(req: any, conversationId: string, event: string, payload: any) {
  try {
    const io = req.app.get('io')
    if (!io) return

    io.to(dmRoom(conversationId)).emit(event, payload)

    const participants = await DmParticipant.find({ conversationId }).lean()
    for (const p of participants) {
      io.to(`user:${p.userId.toString()}`).emit(event, payload)
    }
  } catch (err) {
    console.error('Error emitting DM event:', err)
  }
}

router.get('/dms', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const myParticipations = await DmParticipant.find({ userId }).lean()

  const conversations = await Promise.all(
    myParticipations.map(async (p) => {
      const convId = p.conversationId.toString()
      const other = await getOtherParticipant(convId, userId)
      const lastMsg = await DmMessage.findOne({ conversationId: convId })
        .sort({ createdAt: -1 })
        .lean()
      const conv = await DmConversation.findById(convId).lean()

      return {
        id: convId,
        otherUser: other ? serializeUser(other as any) : null,
        lastMessage: lastMsg
          ? {
              content: lastMsg.isDeleted ? 'Message deleted' : lastMsg.content,
              type: lastMsg.type,
              attachmentName: lastMsg.attachmentName,
              createdAt: lastMsg.createdAt.toISOString(),
              userId: lastMsg.userId.toString(),
            }
          : null,
        updatedAt: conv?.updatedAt.toISOString() ?? p.joinedAt.toISOString(),
      }
    })
  )

  conversations.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
  res.json(conversations)
})

router.post('/dms/with/:otherUserId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const otherId = Array.isArray(req.params.otherUserId)
    ? req.params.otherUserId[0]
    : req.params.otherUserId

  if (!otherId || otherId === userId) {
    res.status(400).json({ error: 'Invalid user' })
    return
  }

  if (!(await areFriends(userId, otherId))) {
    res.status(403).json({ error: 'You must be friends to send direct messages' })
    return
  }

  const conversationId = await getOrCreateConversation(userId, otherId)
  const other = await User.findById(otherId).lean()

  res.json({
    id: conversationId,
    otherUser: other ? serializeUser(other as any) : null,
  })
})

router.get('/dms/:conversationId/messages', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: 'Not a participant' })
    return
  }

  const before = req.query.before ? String(req.query.before) : null
  const limit = Math.min(Number(req.query.limit) || 50, 100)

  const query: any = { conversationId }
  if (before) {
    query._id = { $lt: before }
  }

  const rows = await DmMessage.find(query).sort({ createdAt: -1 }).limit(limit).lean()
  const messages = await Promise.all(
    rows.reverse().map((r) => buildDmMessagePayload(r._id.toString()))
  )
  res.json(messages.filter(Boolean))
})

router.post('/dms/:conversationId/messages', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: 'Not a participant' })
    return
  }

  const content = String(req.body.content ?? '').trim()
  const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null

  if (!content) {
    res.status(400).json({ error: 'Content is required' })
    return
  }

  const msg = await DmMessage.create({
    conversationId,
    userId,
    content,
    type: 'text',
    replyToId: replyToId || undefined,
  })

  await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })

  const payload = await buildDmMessagePayload(msg._id.toString())
  if (payload) {
    await emitDmEvent(req, conversationId, 'new-dm-message', payload)
  }
  res.status(201).json(payload)
})

router.post('/dms/:conversationId/upload', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId

  if (!(await isDmParticipant(conversationId, userId))) {
    res.status(403).json({ error: 'Not a participant' })
    return
  }

  const dataUrl = String(req.body.dataUrl ?? '')
  const fileName = String(req.body.fileName ?? 'file')
  const caption = String(req.body.caption ?? '').trim()

  const saved = saveUploadedFile(`dm-${conversationId}`, dataUrl, fileName)
  if (!saved) {
    res.status(400).json({ error: 'Invalid or too large file (max 10MB)' })
    return
  }

  const msg = await DmMessage.create({
    conversationId,
    userId,
    content: caption || saved.name,
    type: 'file',
    attachmentUrl: saved.url,
    attachmentName: saved.name,
    attachmentMime: saved.mime,
  })

  await DmConversation.findByIdAndUpdate(conversationId, { updatedAt: new Date() })

  const payload = await buildDmMessagePayload(msg._id.toString())
  if (payload) {
    await emitDmEvent(req, conversationId, 'new-dm-message', payload)
  }
  res.status(201).json(payload)
})

router.patch('/dms/:conversationId/messages/:messageId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId
  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId
  const content = String(req.body.content ?? '').trim()

  if (!content) {
    res.status(400).json({ error: 'Content is required' })
    return
  }

  const existing = await DmMessage.findOne({ _id: messageId, conversationId })
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

  await DmMessage.findByIdAndUpdate(messageId, { content, editedAt: new Date() })

  const result = await buildDmMessagePayload(messageId)
  if (result) {
    await emitDmEvent(req, conversationId, 'dm-message-updated', result)
  }
  res.json(result)
})

router.delete('/dms/:conversationId/messages/:messageId', async (req, res): Promise<void> => {
  const userId = requireAuth(req, res)
  if (!userId) return

  const conversationId = Array.isArray(req.params.conversationId)
    ? req.params.conversationId[0]
    : req.params.conversationId
  const messageId = Array.isArray(req.params.messageId)
    ? req.params.messageId[0]
    : req.params.messageId

  const existing = await DmMessage.findOne({ _id: messageId, conversationId })
  if (!existing) {
    res.status(404).json({ error: 'Message not found' })
    return
  }
  if (existing.userId.toString() !== userId) {
    res.status(403).json({ error: 'Forbidden' })
    return
  }

  await DmMessage.findByIdAndUpdate(messageId, { isDeleted: true, content: '' })

  const result = await buildDmMessagePayload(messageId)
  if (result) {
    await emitDmEvent(req, conversationId, 'dm-message-updated', result)
  }
  res.json(result)
})

export default router
