import { Request, Response } from 'express'
import {
  getUserChallenges,
  getUserChallenge,
  userChallengeService,
} from '../services/userChallengeService'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/httpResponse'
import { getRequestTimeZone } from '../utils/timeZone'
import type { AuthRequest } from '../middleware/auth'

// Keep route ids defensive at the controller boundary. The service tests mock
// DAOs, so controller contract tests are responsible for proving malformed
// params are rejected before service/database code runs.
const parseId = (value: unknown, name: string) => {
  const rawValue = Array.isArray(value) ? undefined : value
  const id = Number(rawValue)

  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }

  return id
}

// Coordinates are parsed and range-checked here because check-in/today flows
// are location-sensitive. The test suite covers non-numeric values, arrays, and
// out-of-range lat/lng values so bad input cannot leak into distance logic.
const parseCoordinate = (value: unknown, name: string) => {
  const rawValue = Array.isArray(value) ? undefined : value
  const parsedValue = Number(rawValue)

  if (!Number.isFinite(parsedValue)) {
    throw new ApiError(400, `${name} must be a valid number`)
  }

  const normalizedName = name.toLowerCase()
  const coordinateBounds = normalizedName.includes('lat')
    ? { min: -90, max: 90 }
    : normalizedName.includes('lng') || normalizedName.includes('lon')
      ? { min: -180, max: 180 }
      : undefined

  if (
    coordinateBounds &&
    (parsedValue < coordinateBounds.min || parsedValue > coordinateBounds.max)
  ) {
    throw new ApiError(
      400,
      `${name} must be between ${coordinateBounds.min} and ${coordinateBounds.max}`
    )
  }

  return parsedValue
}

const parseRadius = (value: unknown) => {
  // Radius is optional for today's challenges, but if the client sends it we
  // validate it strictly. This prevents malformed query arrays/strings from
  // silently falling back to the default search radius.
  if (value == null) {
    return 5
  }

  const rawValue = Array.isArray(value) ? undefined : value
  const parsedValue = Number(rawValue)

  if (!Number.isFinite(parsedValue) || parsedValue <= 0) {
    throw new ApiError(400, 'radius must be a positive number')
  }

  return parsedValue
}

export const getChallenges = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const challenges = await getUserChallenges(authUser.sub)

  sendSuccess(res, challenges)
})

export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const userChallengeId = parseId(req.params.id, 'Challenge id')
  const userChallenge = await getUserChallenge(authUser.sub, userChallengeId)

  sendSuccess(res, userChallenge)
})

export const getTodayUserChallenges = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) throw new ApiError(401, 'Authenticated user is missing')

  if (req.query.lat == null || req.query.lng == null) {
    throw new ApiError(400, 'lat and lng query params are required')
  }

  const lat = parseCoordinate(req.query.lat, 'lat')
  const lng = parseCoordinate(req.query.lng, 'lng')
  const radius = parseRadius(req.query.radius)
  const timeZone = getRequestTimeZone(req)

  const data = await userChallengeService.getOrCreateTodayChallenges(
    authUser.sub,
    lat,
    lng,
    radius,
    timeZone
  )

  sendSuccess(res, data)
})

export const acceptUserChallenge = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const userChallengeId = parseId(req.params.id, 'User challenge id')
  const acceptedFromLat = parseCoordinate(req.body?.acceptedFromLat, 'acceptedFromLat')
  const acceptedFromLng = parseCoordinate(req.body?.acceptedFromLng, 'acceptedFromLng')

  const data = await userChallengeService.acceptChallenge(
    authUser.sub,
    userChallengeId,
    acceptedFromLat,
    acceptedFromLng
  )

  sendSuccess(res, data, 'Challenge accepted')
})

export const cancelUserChallenge = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const userChallengeId = parseId(req.params.id, 'User challenge id')
  const data = await userChallengeService.cancelChallenge(authUser.sub, userChallengeId)

  sendSuccess(res, data, 'Challenge cancelled')
})

export const checkInUserChallenge = asyncHandler(async (req: Request, res: Response) => {
  const authUser = (req as AuthRequest).auth
  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  const userChallengeId = parseId(req.params.id, 'User challenge id')
  const completedFromLat = parseCoordinate(req.body?.completedFromLat, 'completedFromLat')
  const completedFromLng = parseCoordinate(req.body?.completedFromLng, 'completedFromLng')
  const timeZone = getRequestTimeZone(req)

  const data = await userChallengeService.checkInChallenge(
    authUser.sub,
    userChallengeId,
    completedFromLat,
    completedFromLng,
    timeZone
  )

  sendSuccess(res, data, 'Challenge checked in')
})
