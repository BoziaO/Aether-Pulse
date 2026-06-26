import { type Request, type Response } from 'express'
import { SendMessageBody } from '@workspace/api-zod'

import { MessageService } from '../services/message.service'
import { asyncHandler } from '../utils/async-handler'
import { requireAuth } from '../middleware/auth'

export const MessageController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const before = req.query.before ? String(req.query.before) : null
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const messages = await MessageService.listMessages(rawId, userId, before, limit)
    res.json(messages)
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const q = String(req.query.q ?? '').trim()
    if (!q || q.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' })
      return
    }
    const messages = await MessageService.searchMessages(rawId, userId, q)
    res.json(messages)
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const parsed = SendMessageBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null
    const payload = await MessageService.createMessage(
      rawId,
      userId,
      parsed.data.content,
      parsed.data.type,
      replyToId
    )
    if (payload) {
      const io = req.app.get('io')
      io?.to(rawId).emit('new-message', payload)
    }
    res.status(201).json(payload)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId
    const content = String(req.body.content ?? '').trim()
    const payload = await MessageService.updateMessage(rawId, messageId, userId, content)
    if (payload) {
      const io = req.app.get('io')
      io?.to(rawId).emit('message-updated', payload)
    }
    res.json(payload)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId
    const payload = await MessageService.deleteMessage(rawId, messageId, userId)
    if (payload) {
      const io = req.app.get('io')
      io?.to(rawId).emit('message-updated', payload)
    }
    res.json(payload)
  }),

  toggleReaction: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId
    const emoji = String(req.body.emoji ?? '').trim()
    if (!emoji) {
      res.status(400).json({ error: 'Emoji is required' })
      return
    }
    const payload = await MessageService.toggleReaction(rawId, messageId, userId, emoji)
    if (payload) {
      const io = req.app.get('io')
      io?.to(rawId).emit('message-updated', payload)
    }
    res.json(payload)
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const dataUrl = String(req.body.dataUrl ?? '')
    const fileName = String(req.body.fileName ?? 'file')
    const caption = String(req.body.caption ?? '').trim()
    const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null
    const payload = await MessageService.uploadFile(
      rawId,
      userId,
      dataUrl,
      fileName,
      caption,
      replyToId
    )
    if (payload) {
      const io = req.app.get('io')
      io?.to(rawId).emit('new-message', payload)
    }
    res.status(201).json(payload)
  }),
}
