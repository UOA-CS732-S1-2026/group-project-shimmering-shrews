import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getChallenges,
  getChallenge,
  getTodayUserChallenges,
} from '../controllers/userChallengeController'

const router = Router()

router.get('/today', requireAuth, getTodayUserChallenges)
router.get('/', requireAuth, getChallenges)
router.get('/:id', requireAuth, getChallenge)

export default router
