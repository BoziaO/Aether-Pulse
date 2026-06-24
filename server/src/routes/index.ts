import { Router, type IRouter } from 'express'

import authRouter from './auth'
import dmsRouter from './dms'
import friendsRouter from './friends'
import healthRouter from './health'
import linkPreviewRouter from './linkPreview'
import messagesRouter from './messages'
import roomsRouter from './rooms'
import usersRouter from './users'

const router: IRouter = Router()

router.use(healthRouter)
router.use(authRouter)
router.use(usersRouter)
router.use(roomsRouter)
router.use(messagesRouter)
router.use(friendsRouter)
router.use(dmsRouter)
router.use(linkPreviewRouter)

export default router
