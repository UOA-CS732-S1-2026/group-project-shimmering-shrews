import { Router } from 'express'
import { getChallenges, getChallenge, checkInChallenge, createChallengesFromLocations } from '../controllers/challengeController'
import { requireAuth } from '../middleware/auth'

const router = Router()

router.get('/', getChallenges)
router.get('/create-new', createChallengesFromLocations)
router.get('/:id', getChallenge)
router.post('/:id/checkin', requireAuth, checkInChallenge)

export default router
