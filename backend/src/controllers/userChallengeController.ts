import { Response, NextFunction } from 'express'
import { AuthRequest } from '../middleware/auth'
import { userChallengeService } from '../services/userChallengeService'

export const getTodayUserChallenges = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authId = req.auth?.sub

    if (!authId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized',
      })
    }

    const data = await userChallengeService.getOrCreateTodayChallenges(authId)

    return res.json({
      success: true,
      data,
    })
  } catch (error) {
    next(error)
  }
}