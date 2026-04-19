import { Router } from 'express'
import { getChallenges, createChallengesFromLocations } from '../controllers/challengeController'

const router = Router()

router.get('/', getChallenges)
router.get('/create-new', createChallengesFromLocations)

export default router