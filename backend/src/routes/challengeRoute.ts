import { Router } from 'express'
import { getChallenges, getChallenge, createChallengesFromLocations } from '../controllers/challengeController'

const router = Router()

router.get('/', getChallenges)
router.get('/create-new', createChallengesFromLocations)
router.get('/:id', getChallenge)

export default router
