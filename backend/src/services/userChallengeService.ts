import { ApiError } from '../utils/ApiError'
import { userDAO } from '../daos/userDao'
import {
  findUserChallenge,
  findUserChallenges,
  userChallengeDAO,
} from '../daos/userChallengeDao'
import { findAllActiveChallenges } from '../daos/challengeDao'

export const getUserChallenges = async (authId: string) => {
  const user = await userDAO.getUserByAuthId(authId)
  const userId = user?.id
  if (!userId) {
    throw new ApiError(404, 'User not found')
  }

  const userChallenges = await findUserChallenges(userId)

  if (!userChallenges) {
    throw new ApiError(404, 'User challenges not found')
  }

  return userChallenges
}

export const getUserChallenge = async (userChallengeId: number) => {
  const userChallenge = await findUserChallenge(userChallengeId)

  if (!userChallenge) {
    throw new ApiError(404, 'User challenge not found')
  }

  return userChallenge
}

export const userChallengeService = {
  async getOrCreateTodayChallenges(authId: string) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(user.id, today)

    if (userChallenges.length === 0) {
      const challenges = await findAllActiveChallenges()

      await userChallengeDAO.createTodayUserChallenges(user.id, challenges, today)

      userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(user.id, today)
    }

    return userChallenges
  },
}
