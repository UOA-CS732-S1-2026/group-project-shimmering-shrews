import { Router } from 'express'
import { getChallenges, getChallenge, createChallengesFromLocations } from '../controllers/challengeController'

const router = Router()

// Returns all active challenges.
router.get('/', getChallenges)

// Fetches locations from Geoapify and creates new challenges from them.
router.get('/create-new', createChallengesFromLocations)

// Returns a single active challenge by ID.
router.get('/:id', getChallenge)

export default router