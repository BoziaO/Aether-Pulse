import { type Request, type Response } from 'express'
import { UpdateUserBody } from '@workspace/api-zod'

import { UserService } from '../services/user.service'
import { asyncHandler } from '../utils/async-handler'
import { type AuthenticatedRequest } from '../middleware/auth'

export const UserController = {
  getProfile: asyncHandler(async (req: Request, res: Response) => {
    const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const viewerId = (req as AuthenticatedRequest).user?.userId ?? null
    const result = await UserService.getProfile(rawId, viewerId)
    res.json(result)
  }),

  getStats: asyncHandler(async (req: Request, res: Response) => {
    const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    const result = await UserService.getStats(rawId)
    res.json(result)
  }),

  updateProfile: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as AuthenticatedRequest).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const rawId = Array.isArray(req.params.userId) ? req.params.userId[0] : req.params.userId
    if (userId !== rawId) {
      res.status(403).json({ error: 'Forbidden' })
      return
    }

    const parsed = UpdateUserBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }

    const result = await UserService.updateProfile(rawId, parsed.data as any)
    const io = req.app.get('io')
    io?.emit('user-profile-updated', result)
    res.json(result)
  }),

  uploadAvatar: asyncHandler(async (req: Request, res: Response) => {
    const sessionUserId = (req as AuthenticatedRequest).user?.userId
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

    const storedDataUrl = await UserService.uploadAvatar(rawId, dataUrl)
    const updated = await UserService.updateProfile(rawId, { avatarUrl: storedDataUrl } as any)
    const io = req.app.get('io')
    io?.emit('user-profile-updated', updated)
    res.json({ avatarUrl: storedDataUrl, user: updated })
  }),

  uploadBanner: asyncHandler(async (req: Request, res: Response) => {
    const sessionUserId = (req as AuthenticatedRequest).user?.userId
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

    const storedDataUrl = await UserService.uploadBanner(rawId, dataUrl)
    const updated = await UserService.updateProfile(rawId, { bannerUrl: storedDataUrl } as any)
    const io = req.app.get('io')
    io?.emit('user-profile-updated', updated)
    res.json({ bannerUrl: storedDataUrl, user: updated })
  }),
}
