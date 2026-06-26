import { Router, type IRouter } from 'express'

import { MessageController } from '../controllers/message.controller'

const router: IRouter = Router()

router.get('/rooms/:roomId/messages', MessageController.list)
router.get('/rooms/:roomId/messages/search', MessageController.search)
router.post('/rooms/:roomId/messages', MessageController.create)
router.patch('/rooms/:roomId/messages/:messageId', MessageController.update)
router.delete('/rooms/:roomId/messages/:messageId', MessageController.remove)
router.post('/rooms/:roomId/messages/:messageId/reactions', MessageController.toggleReaction)
router.post('/rooms/:roomId/upload', MessageController.upload)

export default router
