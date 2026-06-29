import { Router, type IRouter } from 'express'

import { AuthController } from '../controllers/auth.controller'

const router: IRouter = Router()

router.post('/auth/register', AuthController.register)
router.post('/auth/login', AuthController.login)
router.post('/auth/logout', AuthController.logout)
router.get('/auth/me', AuthController.me)
router.post('/auth/change-password', AuthController.changePassword)
router.post('/auth/refresh', AuthController.refresh)
router.post('/auth/forgot-password', AuthController.forgotPassword)
router.post('/auth/reset-password', AuthController.resetPassword)
router.get('/auth/oauth/:provider/url', AuthController.getOAuthUrl)
router.post('/auth/oauth/:provider/callback', AuthController.oauthCallback)

export default router
