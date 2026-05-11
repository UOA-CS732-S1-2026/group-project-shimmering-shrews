import { Request, Response } from 'express'
import { UserService } from '../services/userService'
import { asyncHandler } from '../utils/asyncHandler'
import { AuthRequest } from '../middleware/auth'

export const getProfileInfo = asyncHandler(
  async (req: AuthRequest, res: Response) => {
    const userId = req.auth!.sub
    const profile = await UserService.getProfile(userId)

    res.status(200).json({
      success: true,
      data: profile,
    })
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