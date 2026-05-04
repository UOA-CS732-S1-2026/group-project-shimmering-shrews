import { Request, Response } from 'express'
import {
  getUserChallenges,
  getUserChallenge,
  userChallengeService,
} from '../services/userChallengeService'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import type { AuthRequest } from '../middleware/auth'

const parseId = (value: unknown, name: string) => {
  const rawValue = Array.isArray(value) ? undefined : value
  const id = Number(rawValue)

  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }

  return id
}

export const getChallenges = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const challenges = await getUserChallenges(authUser.sub)

  res.status(200).json({
    success: true,
    data: challenges,
  })
})

export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const userChallengeId = parseId(req.params.id, 'Challenge id')
  const userChallenge = await getUserChallenge(userChallengeId)

  res.status(200).json({
    success: true,
    data: userChallenge,
  })
})

export const getTodayUserChallenges = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) throw new ApiError(401, 'Authenticated user is missing')

  const lat = parseFloat(req.query.lat as string)
  const lng = parseFloat(req.query.lng as string)
  const radius = parseFloat(req.query.radius as string) || 5 // default 5km

  if (isNaN(lat) || isNaN(lng)) {
    throw new ApiError(400, 'lat and lng query params are required')
  }

  const data = await userChallengeService.getOrCreateTodayChallenges(
    authUser.sub, lat, lng, radius
  )

  res.status(200).json({ success: true, data })
})
