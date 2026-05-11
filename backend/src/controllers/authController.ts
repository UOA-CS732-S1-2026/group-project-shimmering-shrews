import { syncUserProfileByAuth } from '../daos/profileDao'
import { AuthRequest } from '../middleware/auth'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/httpResponse'

export const syncUser = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).auth

  if (!user?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  if (!user?.email) {
    throw new ApiError(401, 'Authenticated user email is missing')
  }

  const profile = await syncUserProfileByAuth({
    authId: user.sub,
    email: user.email,
  })

  // Use the shared response helper so auth/profile controllers have the same
  // success envelope asserted by controller and app contract tests.
  sendSuccess(res, profile)
})
