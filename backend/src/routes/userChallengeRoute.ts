import { Router } from 'express'
import { getTodayUserChallenges } from '../controllers/userChallengeController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/today', requireAuth, getTodayUserChallenges)

export default router