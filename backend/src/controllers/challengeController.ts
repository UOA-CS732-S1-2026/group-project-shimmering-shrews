import { Request, Response } from 'express'
import { getAllChallenges, getChallengeDetails, checkInToChallenge, createNewChallenges } from '../services/challengeService'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/httpResponse'
import type { AuthRequest } from '../middleware/auth'

// Keep controller responses on one shared success envelope so contract tests can
// assert the API shape consistently across read and mutation endpoints.
const parseId = (value: unknown, name: string) => {
  const rawValue = Array.isArray(value) ? undefined : value
  const id = Number(rawValue)

  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }

  return id
}

export const getChallenges = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await getAllChallenges()

  sendSuccess(res, challenges)
})

export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = parseId(req.params.id, 'Challenge id')
  const challenge = await getChallengeDetails(challengeId)

  sendSuccess(res, challenge)
})

export const checkInChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = parseId(req.params.id, 'Challenge id')
  const authUser = (req as AuthRequest).auth

  if (!authUser?.sub) {
    throw new ApiError(401, 'Authenticated user is missing')
  }

  if (!authUser.email) {
    throw new ApiError(401, 'Authenticated user email is missing')
  }

  const checkIn = await checkInToChallenge(challengeId, authUser.sub, authUser.email)

  sendSuccess(res, checkIn, 'Challenge checked in')
})

export const createChallengesFromLocations = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await createNewChallenges()

  sendSuccess(res, challenges, 'Challenges created from new locations')
})
