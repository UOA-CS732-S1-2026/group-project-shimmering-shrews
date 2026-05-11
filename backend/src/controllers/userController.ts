import { Request, Response } from 'express'
import { UserService } from '../services/userService'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middleware/auth'
import { sendSuccess } from '../utils/httpResponse'
import { ApiError } from '../utils/ApiError'

export const getProfileInfo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    if (!req.auth?.sub) {
      throw new ApiError(401, 'Authenticated user is missing')
    }

    const userId = req.auth.sub
    const profile = await UserService.getProfile(userId)

    // The user profile endpoint returns the same success envelope as the newer
    // profile/auth controllers, avoiding one-off response shapes in tests.
    sendSuccess(res, profile)
  }
)

export const getLeaderboard = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const authUserId = req.auth!.sub
    const leaderboard = await UserService.getLeaderboard(authUserId)
    res.status(200).json({
      success: true,
      data: leaderboard,
    })
  }
)
