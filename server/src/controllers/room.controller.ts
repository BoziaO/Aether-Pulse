import { type Request, type Response } from 'express'
import { CreateRoomBody, JoinRoomBody } from '@workspace/api-zod'

import { RoomService } from '../services/room.service'
import { asyncHandler } from '../utils/async-handler'
import { requireAuth } from '../middleware/auth'

export const RoomController = {
  list: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rooms = await RoomService.listUserRooms(userId)
    res.json(rooms)
  }),

  create: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const parsed = CreateRoomBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const result = await RoomService.createRoom(
      userId,
      parsed.data as { name: string; quality?: string }
    )
    res.status(201).json(result)
  }),

  get: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const result = await RoomService.getRoom(rawId, userId)
    res.json(result)
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const result = await RoomService.updateRoom(rawId, userId, req.body)
    const io = req.app.get('io')
    io?.to(rawId).emit('room-updated', result)
    res.json(result)
  }),

  remove: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const io = req.app.get('io')
    await RoomService.deleteRoom(rawId, userId, io)
    res.sendStatus(204)
  }),

  joinByCode: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const parsed = JoinRoomBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const io = req.app.get('io')
    const result = await RoomService.joinByCode(userId, parsed.data.inviteCode, io)
    res.json(result)
  }),

  join: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const parsed = JoinRoomBody.safeParse(req.body)
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.message })
      return
    }
    const io = req.app.get('io')
    const result = await RoomService.joinRoom(userId, rawId, parsed.data.inviteCode, io)
    res.json(result)
  }),

  leave: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const io = req.app.get('io')
    await RoomService.leaveRoom(rawId, userId, io)
    res.json({ ok: true })
  }),

  activity: asyncHandler(async (req: Request, res: Response) => {
    const userId = requireAuth(req, res)
    if (!userId) return
    const rawId = Array.isArray(req.params.roomId) ? req.params.roomId[0] : req.params.roomId
    const result = await RoomService.getActivity(rawId, userId)
    res.json(result)
  }),
}
