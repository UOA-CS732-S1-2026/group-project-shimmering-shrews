import { ApiError } from '../utils/ApiError'
import { userDAO } from '../daos/userDao'
import {
  findUserChallenge,
  findUserChallenges,
  userChallengeDAO,
} from '../daos/userChallengeDao'
import { findAllActiveChallenges } from '../daos/challengeDao'
import { filterChallengesByRadius, DAILY_CHALLENGE_LIMIT } from './challengeService'

export const getUserChallenges = async (authId: string) => {
  const user = await userDAO.getUserByAuthId(authId)
  const userId = user?.id
  if (!userId) throw new ApiError(404, 'User not found')
  const userChallenges = await findUserChallenges(userId)
  if (!userChallenges) throw new ApiError(404, 'User challenges not found')
  return userChallenges
}

export const getUserChallenge = async (userChallengeId: number) => {
  const userChallenge = await findUserChallenge(userChallengeId)
  if (!userChallenge) throw new ApiError(404, 'User challenge not found')
  return userChallenge
}

export const userChallengeService = {
  async getOrCreateTodayChallenges(
    authId: string,
    lat: number,
    lng: number,
    radiusKm: number,
  ) {
    const user = await userDAO.getUserByAuthId(authId)
    if (!user) throw new ApiError(404, 'User not found')

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    let userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(user.id, today)
    console.log('Existing today challenges:', userChallenges.length)

    if (userChallenges.length === 0) {
      const allChallenges = await findAllActiveChallenges()

      const nearby = filterChallengesByRadius(allChallenges, lat, lng, radiusKm)

      const limited = nearby.slice(0, DAILY_CHALLENGE_LIMIT)
      
      if (limited.length > 0) {
        await userChallengeDAO.createTodayUserChallenges(user.id, limited)
      }

      userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(user.id, today)
      console.log('Final challenges:', userChallenges.length)
    }

    return userChallenges
  },
}