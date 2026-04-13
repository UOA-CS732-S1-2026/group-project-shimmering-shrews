import { Router } from 'express'
import { getChallenges } from '../controllers/challengeController'

const router = Router()

router.get('/', getChallenges)

export default router