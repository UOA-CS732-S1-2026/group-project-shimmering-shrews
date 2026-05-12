import {
  completeUserChallengeByUserChallengeId,
  findAllActiveChallenges,
} from '../daos/challengeDao'
import {
  findUserChallengeForUser,
  findUserChallenges,
  userChallengeDAO,
} from '../daos/userChallengeDao'
import { userDAO } from '../daos/userDao'
import { ALLOWED_COMPLETION_RADIUS_METERS } from '../config/constants'
import { ApiError } from '../utils/ApiError'
import {
  getNextStartOfUserCalendarDay,
  getStartOfUserCalendarDay,
} from '../utils/streak'

import { DAILY_CHALLENGE_LIMIT, filterChallengesByRadius } from './challengeService'
import { calculateLevel, getXpForLevelStart, getXpRequiredForNextLevel } from '../utils/leveling'
const toRad = (deg: number) => (deg * Math.PI) / 180

const haversineDistanceMetres = (lat1: number, lon1: number, lat2: number, lon2: number) => {
  const earthRadiusMetres = 6371000
  const dLat = toRad(lat2 - lat1)
  const dLon = toRad(lon2 - lon1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return earthRadiusMetres * c
}

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
  async getOrCreateTodayChallenges(
    authId: string,
    lat: number,
    lng: number,
    radiusKm: number,
    timeZone?: string
  ) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const now = new Date()
    const todayStart = getStartOfUserCalendarDay(now, timeZone)
    const tomorrowStart = getNextStartOfUserCalendarDay(now, timeZone)

    await userChallengeDAO.expireOpenChallengesBeforeDate(user.id, todayStart)

    let userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(
      user.id,
      todayStart,
      tomorrowStart
    )

    if (userChallenges.length === 0) {
      const allChallenges = await findAllActiveChallenges()
      const nearbyChallenges = filterChallengesByRadius(allChallenges, lat, lng, radiusKm)
      const limitedChallenges = nearbyChallenges.slice(0, DAILY_CHALLENGE_LIMIT)

      if (limitedChallenges.length > 0) {
        await userChallengeDAO.createTodayUserChallenges(user.id, limitedChallenges)
      }

      userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(
        user.id,
        todayStart,
        tomorrowStart
      )
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
    completedFromLng: number,
    timeZone?: string
  ) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const userChallenge = await findUserChallengeForUser(userChallengeId, user.id)

    if (!userChallenge) {
      throw new ApiError(404, 'User challenge not found')
    }

    if (userChallenge.status === 'completed') {
      return {
        userChallenge,
        notification: null,
      }
    }

    if (userChallenge.status !== 'accepted') {
      throw new ApiError(409, 'Challenge must be accepted before check in')
    }

    const challengeLocation = userChallenge.challenge?.location

    if (!challengeLocation || challengeLocation.latitude == null || challengeLocation.longitude == null) {
      throw new ApiError(400, 'Challenge location is not set')
    }

    const distanceMeters = haversineDistanceMetres(
      Number(challengeLocation.latitude),
      Number(challengeLocation.longitude),
      Number(completedFromLat),
      Number(completedFromLng)
    )

    if (distanceMeters > ALLOWED_COMPLETION_RADIUS_METERS) {
      throw new ApiError(
        409,
        `User is not within required distance to complete challenge (${Math.round(distanceMeters)}m away, must be within ${ALLOWED_COMPLETION_RADIUS_METERS}m)`
      )
    }
    const result = await completeUserChallengeByUserChallengeId(
      userChallengeId,
      user.id,
      timeZone
    )

    if (!result) {
      throw new ApiError(409, 'Challenge cannot be checked in from its current status')
    }

    // Use transactional user data from the DAO to ensure consistency
    const { userChallenge: checkIn, previousUser, updatedUser, xpAwarded } = result
    const xpGained = xpAwarded ?? checkIn.xp_worth ?? checkIn.challenge?.xp_worth ?? 0

    if (xpGained <= 0) {
      return {
        userChallenge: checkIn,
        notification: null,
      }
    }

    const previousXp = previousUser.xp_earned
    const previousLevel = previousUser.level
    const newXp = updatedUser.xp_earned
    const newLevel = updatedUser.level
    const levelUp = newLevel > previousLevel

    const previousLevelXpRequired = getXpRequiredForNextLevel(previousLevel)
    const nextLevelXpRequired = getXpRequiredForNextLevel(newLevel)

    const xpForLevelStart = getXpForLevelStart(previousLevel)
    const xpForNextLevelStart = getXpForLevelStart(newLevel)

    const notificationMessage = {
      type: 'challenge_completed',
      xpGained,
      previousXp,
      newXp,
      previousLevelXpRequired,
      nextLevelXpRequired,
      levelUp,
      previousLevel,
      newLevel,
      xpForLevelStart,
      xpForNextLevelStart,
      message: levelUp
        ? `Congratulations! You've completed the challenge, earned ${xpGained} XP, and reached Level ${newLevel}!`
        : `Challenge completed! You've earned ${xpGained} XP.`,
    }
    return {
      userChallenge: checkIn,
      notification: notificationMessage,
    }
  },
}
