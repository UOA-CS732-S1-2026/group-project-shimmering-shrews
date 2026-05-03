import { Router } from 'express'
import { requireAuth } from '../middleware/auth'
import {
  getChallenges,
  getChallenge,
  getTodayUserChallenges,
  acceptUserChallenge,
  cancelUserChallenge,
  checkInUserChallenge,
} from '../controllers/userChallengeController'

const router = Router()

router.get('/today', requireAuth, getTodayUserChallenges)
router.get('/', requireAuth, getChallenges)
router.patch('/:id/accept', requireAuth, acceptUserChallenge)
router.patch('/:id/cancel', requireAuth, cancelUserChallenge)
router.post('/:id/checkin', requireAuth, checkInUserChallenge)
router.get('/:id', requireAuth, getChallenge)

export default router
