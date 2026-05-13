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

// Returns today's challenges for the authenticated user based on their location.
router.get('/today', requireAuth, getTodayUserChallenges)

// Returns all user challenges for the authenticated user.
router.get('/', requireAuth, getChallenges)

// Accepts a user challenge, recording the user's location at acceptance.
router.patch('/:id/accept', requireAuth, acceptUserChallenge)

// Cancels a user challenge.
router.patch('/:id/cancel', requireAuth, cancelUserChallenge)

// Checks in a user to a challenge, verifying proximity and awarding XP.
router.post('/:id/checkin', requireAuth, checkInUserChallenge)

// Returns a single user challenge by ID.
router.get('/:id', requireAuth, getChallenge)

export default router