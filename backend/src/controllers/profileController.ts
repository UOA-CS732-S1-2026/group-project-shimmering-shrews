import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import type { AuthRequest } from '../middleware/auth'
import { getUserProfile } from '../services/profileService'
import { sendSuccess } from '../utils/httpResponse'

export const getMyProfile = asyncHandler(async (req, res) => {
  const authUser = (req as AuthRequest).auth

  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const profile = await getUserProfile(authUser.sub, authUser.email)

  // Keep profile responses aligned with the shared success envelope covered by
  // controller/app contract tests.
  sendSuccess(res, profile)
})
