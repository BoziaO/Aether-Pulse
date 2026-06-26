import { Router, type IRouter } from 'express'

import { DmController } from '../controllers/dm.controller'

const router: IRouter = Router()

router.get('/dms', DmController.list)
router.post('/dms/with/:otherUserId', DmController.getOrCreate)
router.get('/dms/:conversationId/messages', DmController.getMessages)
router.post('/dms/:conversationId/messages', DmController.createMessage)
router.post('/dms/:conversationId/upload', DmController.upload)
router.patch('/dms/:conversationId/messages/:messageId', DmController.updateMessage)
router.delete('/dms/:conversationId/messages/:messageId', DmController.deleteMessage)

export default router
