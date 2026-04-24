import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import type { AuthRequest } from '../middleware/auth'
import { getUserProfile } from '../services/profileService'

export const getMyProfile = asyncHandler(async (req, res) => {
  const authUser = (req as AuthRequest).auth

  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const profile = await getUserProfile(authUser.sub, authUser.email)

  res.status(200).json({
    success: true,
    data: profile,
  })
})
