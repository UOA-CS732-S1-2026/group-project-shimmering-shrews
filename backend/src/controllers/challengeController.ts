import { Request, Response } from 'express'
import { getAllChallenges, getChallengeDetails, checkInToChallenge, createNewChallenges } from '../services/challengeService'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'

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

  res.status(200).json({
    success: true,
    data: challenges,
  })
})

export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = parseId(req.params.id, 'Challenge id')
  const challenge = await getChallengeDetails(challengeId)

  res.status(200).json({
    success: true,
    data: challenge,
  })
})

export const checkInChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = parseId(req.params.id, 'Challenge id')
  const { authId } = req.body as { authId: string }
  const checkIn = await checkInToChallenge(challengeId, authId)

  res.status(200).json({
    success: true,
    message: 'Challenge checked in',
    data: checkIn,
  })
})

export const createChallengesFromLocations = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await createNewChallenges();

  res.status(200).json({
    success: true,
    message: 'Challenges created from new locations',
    data: challenges,
  })
})
