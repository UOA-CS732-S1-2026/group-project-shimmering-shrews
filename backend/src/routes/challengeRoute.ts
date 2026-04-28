import { Router } from 'express'
import { getChallenges, getChallenge, checkInChallenge, createChallengesFromLocations } from '../controllers/challengeController'

const router = Router()

router.get('/', getChallenges)
router.get('/create-new', createChallengesFromLocations)
router.get('/:id', getChallenge)
router.post('/:id/checkin', checkInChallenge)

export default router
