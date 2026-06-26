import { Router, type IRouter } from 'express'

import { FriendController } from '../controllers/friend.controller'

const router: IRouter = Router()

router.get('/friends', FriendController.list)
router.get('/friends/search', FriendController.search)
router.post('/friends/request', FriendController.request)
router.post('/friends/accept', FriendController.accept)
router.post('/friends/reject', FriendController.reject)
router.delete('/friends/:otherUserId', FriendController.remove)
router.post('/friends/block', FriendController.block)
router.get('/friends/suggestions', FriendController.suggestions)
router.get('/friends/status/:otherUserId', FriendController.status)

export default router
