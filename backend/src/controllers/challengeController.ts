import { Request, Response } from 'express'
import { getAllChallenges, createNewChallenges } from '../services/challengeService'
import { asyncHandler } from '../utils/asyncHandler'

export const getChallenges = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await getAllChallenges()

  res.status(200).json({
    success: true,
    data: challenges,
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