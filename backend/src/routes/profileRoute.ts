import { Router } from 'express'
import { getMyProfile } from '../controllers/profileController'
import { requireAuth } from '../middleware/auth'

const router = Router()

// Returns the full profile for the authenticated user.
router.get('/me', requireAuth, getMyProfile)

export default router
