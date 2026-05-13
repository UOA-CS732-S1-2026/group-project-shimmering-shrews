import { Router } from "express"
import { requireAuth, requireSelf } from "../middleware/auth"
import { getProfileInfo, getLeaderboard } from "../controllers/userController"

const router = Router()

// Returns the authenticated user's profile information.
router.get('/profile-info', requireAuth, getProfileInfo)

// Returns the leaderboard of top users ranked by XP.
router.get('/leaderboard', requireAuth, getLeaderboard)

export default router