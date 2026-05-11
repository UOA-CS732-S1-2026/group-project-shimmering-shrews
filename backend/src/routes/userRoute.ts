import { Router } from "express"
import { requireAuth, requireSelf } from "../middleware/auth"
import { getProfileInfo, getLeaderboard } from "../controllers/userController"


const router = Router()

router.get('/profile-info', requireAuth, getProfileInfo)

router.get('/leaderboard', requireAuth, getLeaderboard)

export default router