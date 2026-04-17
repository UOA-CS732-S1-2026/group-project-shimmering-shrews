import { Router } from 'express'
import { syncUser } from '../controllers/authController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.post('/sync-user', requireAuth, syncUser)

export default router