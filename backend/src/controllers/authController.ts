import { syncUserProfileByAuth } from '../daos/profileDao'
import { AuthRequest } from '../middleware/auth'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/httpResponse'

// Syncs the authenticated user's profile with the database.
// Called after login to ensure the user record exists and is up to date.
export const syncUser = asyncHandler(async (req, res) => {
  const user = (req as AuthRequest).auth

  // Ensure the request contains a valid authenticated user
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

  // All responses use sendSuccess to enforce a consistent response shape across all endpoints.
  sendSuccess(res, profile)
})