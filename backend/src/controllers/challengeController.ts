import { Request, Response } from 'express'
import { getAllChallenges } from '../services/challengeService'

export const getChallenges = async (_req: Request, res: Response) => {
  try {
    const challenges = await getAllChallenges()

    res.status(200).json({
      success: true,
      data: challenges,
    })
  } catch (error) {
    console.error('Error fetching challenges:', error)

    res.status(500).json({
      success: false,
      message: 'Failed to fetch challenges',
    })
  }
}