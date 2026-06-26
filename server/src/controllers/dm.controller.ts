import { type Request, type Response } from 'express'

import { DmService } from '../services/dm.service'
import { asyncHandler } from '../utils/async-handler'
import { requireAuth } from '../middleware/auth'

export const DmController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const result = await DmService.listConversations(userId)
    res.json(result)
  }),

  getOrCreate: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const otherId = Array.isArray(req.params.otherUserId)
      ? req.params.otherUserId[0]
      : req.params.otherUserId
    const result = await DmService.getOrCreateConversation(userId, otherId)
    res.json(result)
  }),

  getMessages: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId
    const before = req.query.before ? String(req.query.before) : null
    const limit = Math.min(Number(req.query.limit) || 50, 100)
    const messages = await DmService.getMessages(conversationId, userId, before, limit)
    res.json(messages)
  }),

  createMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId
    const content = String(req.body.content ?? '').trim()
    const replyToId = typeof req.body.replyToId === 'string' ? req.body.replyToId : null
    if (!content) {
      res.status(400).json({ error: 'Content is required' })
      return
    }
    const payload = await DmService.createMessage(conversationId, userId, content, replyToId)
    if (payload) {
      const io = req.app.get('io')
      const participants = await (
        await import('../repositories/dm.repository')
      ).DmRepository.getParticipants(conversationId)
      for (const p of participants as any[]) {
        io?.to(`user:${p.userId.toString()}`).emit('new-dm-message', payload)
      }
    }
    res.status(201).json(payload)
  }),

  upload: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId
    const dataUrl = String(req.body.dataUrl ?? '')
    const fileName = String(req.body.fileName ?? 'file')
    const caption = String(req.body.caption ?? '').trim()
    const payload = await DmService.uploadFile(conversationId, userId, dataUrl, fileName, caption)
    if (payload) {
      const io = req.app.get('io')
      const participants = await (
        await import('../repositories/dm.repository')
      ).DmRepository.getParticipants(conversationId)
      for (const p of participants as any[]) {
        io?.to(`user:${p.userId.toString()}`).emit('new-dm-message', payload)
      }
    }
    res.status(201).json(payload)
  }),

  updateMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId
    const content = String(req.body.content ?? '').trim()
    const payload = await DmService.updateMessage(conversationId, messageId, userId, content)
    if (payload) {
      const io = req.app.get('io')
      const participants = await (
        await import('../repositories/dm.repository')
      ).DmRepository.getParticipants(conversationId)
      for (const p of participants as any[]) {
        io?.to(`user:${p.userId.toString()}`).emit('dm-message-updated', payload)
      }
    }
    res.json(payload)
  }),

  deleteMessage: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const conversationId = Array.isArray(req.params.conversationId)
      ? req.params.conversationId[0]
      : req.params.conversationId
    const messageId = Array.isArray(req.params.messageId)
      ? req.params.messageId[0]
      : req.params.messageId
    const payload = await DmService.deleteMessage(conversationId, messageId, userId)
    if (payload) {
      const io = req.app.get('io')
      const participants = await (
        await import('../repositories/dm.repository')
      ).DmRepository.getParticipants(conversationId)
      for (const p of participants as any[]) {
        io?.to(`user:${p.userId.toString()}`).emit('dm-message-updated', payload)
      }
    }
    res.json(payload)
  }),
}
