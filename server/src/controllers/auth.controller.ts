import { type Request, type Response } from 'express'
import { RegisterBody, LoginBody, RefreshBody } from '@workspace/api-zod'

import { AuthService } from '../services/auth.service'
import { asyncHandler } from '../utils/async-handler'

export const AuthController = {
  register: asyncHandler(async (req: Request, res: Response) => {
    const parsed = RegisterBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const result = await AuthService.register(parsed.data as any)
    res.status(201).json(result)
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const parsed = LoginBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const result = await AuthService.login(parsed.data.username, parsed.data.password)
    res.json(result)
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId
    await AuthService.logout(userId)
    res.json({ ok: true })
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId
    const result = await AuthService.getMe(userId)
    res.json(result)
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user?.userId
    if (!userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }
    const { currentPassword, newPassword } = req.body as {
      currentPassword?: string
      newPassword?: string
    }
    if (!currentPassword || !newPassword) {
      res.status(400).json({ error: 'Current and new password are required' })
      return
    }
    await AuthService.changePassword(userId, currentPassword, newPassword)
    res.json({ ok: true })
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const parsed = RefreshBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const result = await AuthService.refresh(parsed.data.refreshToken)
    res.json(result)
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as { email?: string }
    if (!email) {
      res.status(400).json({ error: 'Email is required' })
      return
    }
    await AuthService.forgotPassword(email)
    res.json({ ok: true })
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    const { token, newPassword } = req.body as { token?: string; newPassword?: string }
    if (!token || !newPassword) {
      res.status(400).json({ error: 'Token and new password are required' })
      return
    }
    const result = await AuthService.resetPassword(token, newPassword)
    res.json(result)
  }),

  getOAuthUrl: asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider as 'google' | 'github'
    const result = await AuthService.getOAuthUrl(provider)
    res.json(result)
  }),

  oauthCallback: asyncHandler(async (req: Request, res: Response) => {
    const provider = req.params.provider as 'google' | 'github'
    const { code } = req.body as { code?: string }
    if (!code) {
      res.status(400).json({ error: 'Authorization code is required' })
      return
    }
    const result = await AuthService.handleOAuthCallback(provider, code)
    res.json(result)
  }),
}
