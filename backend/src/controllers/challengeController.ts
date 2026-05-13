import { Request, Response } from 'express'
import { getAllChallenges, getChallengeDetails, createNewChallenges } from '../services/challengeService'
import { ApiError } from '../utils/ApiError'
import { asyncHandler } from '../utils/asyncHandler'
import { sendSuccess } from '../utils/httpResponse'

// All responses use sendSuccess to enforce a consistent response shape across all endpoints.

// Parses and validates a positive integer from a request parameter or query value.
// Rejects arrays since Express parses duplicate query params as arrays.
const parseId = (value: unknown, name: string) => {
  const rawValue = Array.isArray(value) ? undefined : value
  const id = Number(rawValue)
  if (!Number.isInteger(id) || id < 1) {
    throw new ApiError(400, `${name} must be a positive integer`)
  }
  return id
}

// Returns all active challenges.
export const getChallenges = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await getAllChallenges()
  sendSuccess(res, challenges)
})

// Returns a single active challenge by ID.
export const getChallenge = asyncHandler(async (req: Request, res: Response) => {
  const challengeId = parseId(req.params.id, 'Challenge id')
  const challenge = await getChallengeDetails(challengeId)
  sendSuccess(res, challenge)
})

// Fetches locations from Geoapify and creates new challenges from them.
export const createChallengesFromLocations = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await createNewChallenges()
  sendSuccess(res, challenges, 'Challenges created from new locations')
})