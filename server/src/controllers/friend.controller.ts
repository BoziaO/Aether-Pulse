import { type Request, type Response } from 'express'

import { FriendService } from '../services/friend.service'
import { asyncHandler } from '../utils/async-handler'
import { requireAuth } from '../middleware/auth'
import { logger } from '../utils/logger'

function notifyFriendshipUpdated(req: Request, userA: string, userB: string) {
  try {
    const io = req.app.get('io')
    if (!io) return
    io.to(`user:${userA}`).emit('friendship-updated')
    io.to(`user:${userB}`).emit('friendship-updated')
  } catch (err) {
    logger.error(err, 'Error emitting friendship updated event')
  }
}

export const FriendController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const result = await FriendService.listFriends(userId)
    res.json(result)
  }),

  search: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const q = String(req.query.q ?? '').trim()
    if (q.length < 2) {
      res.status(400).json({ error: 'Query must be at least 2 characters' })
      return
    }
    const result = await FriendService.searchUsers(userId, q)
    res.json(result)
  }),

  request: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const targetId = String(req.body.userId ?? '')
    const result = await FriendService.sendRequest(userId, targetId)
    if (result.status === 'accepted') {
      req.app.get('io')?.to(`user:${targetId}`).emit('friend-accepted', { userId })
    } else {
      const requester = await (
        await import('../repositories/user.repository')
      ).UserRepository.findById(userId)
      if (requester) {
        req.app
          .get('io')
          ?.to(`user:${targetId}`)
          .emit('friend-request', {
            user: await (await import('../utils/serialize-user')).serializeUser(requester as any),
          })
      }
    }
    notifyFriendshipUpdated(req, userId, targetId)
    res.status(result.status === 'accepted' ? 200 : 201).json(result)
  }),

  accept: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const targetId = String(req.body.userId ?? '')
    const result = await FriendService.acceptRequest(userId, targetId)
    req.app.get('io')?.to(`user:${targetId}`).emit('friend-accepted', { userId })
    notifyFriendshipUpdated(req, userId, targetId)
    res.json(result)
  }),

  reject: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const targetId = String(req.body.userId ?? '')
    await FriendService.rejectRequest(userId, targetId)
    notifyFriendshipUpdated(req, userId, targetId)
    res.json({ ok: true })
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const otherId = Array.isArray(req.params.otherUserId)
      ? req.params.otherUserId[0]
      : req.params.otherUserId
    await FriendService.removeFriend(userId, otherId)
    notifyFriendshipUpdated(req, userId, otherId)
    res.json({ ok: true })
  }),

  block: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const targetId = String(req.body.userId ?? '')
    await FriendService.blockUser(userId, targetId)
    notifyFriendshipUpdated(req, userId, targetId)
    res.json({ ok: true })
  }),

  suggestions: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const result = await FriendService.getSuggestions(userId)
    res.json(result)
  }),

  status: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const otherId = Array.isArray(req.params.otherUserId)
      ? req.params.otherUserId[0]
      : req.params.otherUserId
    const result = await FriendService.getStatus(userId, otherId)
    res.json(result)
  }),
}
