import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import type { AuthRequest } from '../middleware/auth'
import { getUserProfile } from '../services/profileService'
import { sendSuccess } from '../utils/httpResponse'
import { getRequestTimeZone } from '../utils/timeZone'

// Returns the full profile for the currently authenticated user,
// including XP, level, streak, badges, and challenge history.
export const getMyProfile = asyncHandler(async (req, res) => {
  const authUser = (req as AuthRequest).auth

  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const profile = await getUserProfile(
    authUser.sub,
    authUser.email,
    getRequestTimeZone(req) // timezone is used to correctly group challenge history by local date
  )

  // Keep profile responses aligned with the shared success envelope covered by
  // controller/app contract tests.
  sendSuccess(res, profile)
})