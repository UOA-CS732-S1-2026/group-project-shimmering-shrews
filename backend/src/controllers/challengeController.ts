import { Request, Response } from 'express'
import { getAllChallenges } from '../services/challengeService'
import { asyncHandler } from '../utils/asyncHandler'

export const getChallenges = asyncHandler(async (_req: Request, res: Response) => {
  const challenges = await getAllChallenges()

  res.status(200).json({
    success: true,
    data: challenges,
  })
})