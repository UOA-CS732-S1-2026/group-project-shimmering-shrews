import { ApiError } from '../utils/ApiError'
import { userDAO } from '../daos/userDao'
import {
  findUserChallengeForUser,
  findUserChallenges,
  userChallengeDAO,
} from '../daos/userChallengeDao'
import {
  completeUserChallengeByUserChallengeId,
  findAllActiveChallenges,
} from '../daos/challengeDao'
import { ALLOWED_COMPLETION_RADIUS_METERS } from '../config/constants'

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

export const getUserChallenge = async (authId: string, userChallengeId: number) => {
  const user = await userDAO.getUserByAuthId(authId)

  if (!user) {
    throw new ApiError(404, 'User not found')
  }

  const userChallenge = await findUserChallengeForUser(userChallengeId, user.id)

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

  async acceptChallenge(
    authId: string,
    userChallengeId: number,
    acceptedFromLat: number,
    acceptedFromLng: number
  ) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const acceptedChallenge = await userChallengeDAO.acceptUserChallenge(
      userChallengeId,
      user.id,
      acceptedFromLat,
      acceptedFromLng
    )

    if (!acceptedChallenge) {
      throw new ApiError(404, 'User challenge not found')
    }

    return acceptedChallenge
  },

  async cancelChallenge(authId: string, userChallengeId: number) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const cancelledChallenge = await userChallengeDAO.cancelUserChallenge(userChallengeId, user.id)

    if (!cancelledChallenge) {
      throw new ApiError(404, 'User challenge not found')
    }

    return cancelledChallenge
  },

  async checkInChallenge(
    authId: string,
    userChallengeId: number,
    completedFromLat: number,
    completedFromLng: number
  ) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    // verify the user's provided location is within an acceptable distance of the challenge location
    const userChallenge = await findUserChallengeForUser(userChallengeId, user.id)

    if (!userChallenge) {
      throw new ApiError(404, 'User challenge not found')
    }

    const challengeLocation = userChallenge.challenge?.location
    if (!challengeLocation || challengeLocation.latitude == null || challengeLocation.longitude == null) {
      throw new ApiError(400, 'Challenge location is not set')
    }

    const lat1 = Number(challengeLocation.latitude)
    const lon1 = Number(challengeLocation.longitude)
    const lat2 = Number(completedFromLat)
    const lon2 = Number(completedFromLng)

    const toRad = (deg: number) => (deg * Math.PI) / 180
    const haversine = (aLat: number, aLon: number, bLat: number, bLon: number) => {
      const R = 6371000 // meters
      const dLat = toRad(bLat - aLat)
      const dLon = toRad(bLon - aLon)
      const A =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const C = 2 * Math.atan2(Math.sqrt(A), Math.sqrt(1 - A))
      return R * C
    }

    const distanceMeters = haversine(lat1, lon1, lat2, lon2)

    if (distanceMeters > ALLOWED_COMPLETION_RADIUS_METERS) {
      throw new ApiError(409, `User is not within required distance to complete challenge (${Math.round(distanceMeters)}m away, must be within ${ALLOWED_COMPLETION_RADIUS_METERS}m)`)
    }

    const checkIn = await completeUserChallengeByUserChallengeId(userChallengeId, user.id)

    if (!checkIn) {
      throw new ApiError(409, 'Challenge cannot be checked in from its current status')
    }

    return checkIn
  },
}
