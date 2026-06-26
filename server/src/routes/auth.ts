import { Router, type IRouter } from 'express'

import { AuthController } from '../controllers/auth.controller'

const router: IRouter = Router()

router.post('/auth/register', AuthController.register)
router.post('/auth/login', AuthController.login)
router.post('/auth/logout', AuthController.logout)
router.get('/auth/me', AuthController.me)
router.post('/auth/change-password', AuthController.changePassword)
router.post('/auth/refresh', AuthController.refresh)

export default router
