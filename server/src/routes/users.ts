import { Router, type IRouter } from 'express'

import { UserController } from '../controllers/user.controller'

const router: IRouter = Router()

router.get('/users/:userId', UserController.getProfile)
router.get('/users/:userId/stats', UserController.getStats)
router.patch('/users/:userId', UserController.updateProfile)
router.post('/users/:userId/avatar', UserController.uploadAvatar)
router.post('/users/:userId/banner', UserController.uploadBanner)

export default router
