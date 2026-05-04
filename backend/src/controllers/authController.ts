import { syncUserProfileByAuth } from '../daos/profileDao'
import { AuthRequest } from '../middleware/auth'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'

export const syncUser = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).auth

  if (!user?.email) {
    throw new ApiError(401, 'Authenticated user email is missing')
  }

  const profile = await syncUserProfileByAuth({
    authId: user.sub,
    email: user.email,
  })

  res.status(200).json({
    success: true,
    data: profile,
  })
})
