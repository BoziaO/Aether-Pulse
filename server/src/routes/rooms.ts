import { Router, type IRouter } from 'express'

import { RoomController } from '../controllers/room.controller'

const router: IRouter = Router()

router.get('/rooms', RoomController.list)
router.post('/rooms', RoomController.create)
router.get('/rooms/:roomId', RoomController.get)
router.patch('/rooms/:roomId', RoomController.update)
router.delete('/rooms/:roomId', RoomController.remove)
router.post('/rooms/join-by-code', RoomController.joinByCode)
router.post('/rooms/:roomId/join', RoomController.join)
router.post('/rooms/:roomId/leave', RoomController.leave)
router.get('/rooms/:roomId/activity', RoomController.activity)

export default router
