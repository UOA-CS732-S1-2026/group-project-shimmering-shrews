import { Router } from "express"
import { requireAuth, requireSelf } from "../middleware/auth"
import { getProfileInfo } from "../controllers/userController"

const router = Router()

router.get('/profile-info', requireAuth, getProfileInfo)

export default router