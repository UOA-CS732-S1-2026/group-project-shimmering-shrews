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
import { badgeDAO } from '../daos/badgeDAO'
import { ALLOWED_COMPLETION_RADIUS_METERS } from '../config/constants'
import { ApiError } from '../utils/ApiError'

import { DAILY_CHALLENGE_LIMIT, filterChallengesByRadius } from './challengeService'
import { calculateLevel } from '../utils/leveling'
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
    radiusKm: number
  ) {
    const user = await userDAO.getUserByAuthId(authId)

    if (!user) {
      throw new ApiError(404, 'User not found')
    }

    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)

    await userChallengeDAO.expireOpenChallengesBeforeDate(user.id, today)

    let userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(user.id, today)

    if (userChallenges.length === 0) {
      const allChallenges = await findAllActiveChallenges()
      const nearbyChallenges = filterChallengesByRadius(allChallenges, lat, lng, radiusKm)
      const limitedChallenges = nearbyChallenges.slice(0, DAILY_CHALLENGE_LIMIT)

      if (limitedChallenges.length > 0) {
        await userChallengeDAO.createTodayUserChallenges(user.id, limitedChallenges)
      }

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

    const userChallenge = await findUserChallengeForUser(userChallengeId, user.id)

    if (!userChallenge) {
      throw new ApiError(404, 'User challenge not found')
    }

    if (userChallenge.status === 'completed') {
      return userChallenge
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
    const previousXp = user.xp_earned || 0
    const previousLevel = user.level || 1
    const badgesBefore = await badgeDAO.getBadgesForUser(user.id)

    const checkIn = await completeUserChallengeByUserChallengeId(userChallengeId, user.id)

    if (!checkIn) {
      throw new ApiError(409, 'Challenge cannot be checked in from its current status')
    }

    const xpGained = checkIn.xp_worth || checkIn.challenge?.xp_worth || 0

    const newXp= previousXp + xpGained
    const newLevel = calculateLevel(newXp)
    const levelUp = newLevel > previousLevel
    const badgesAfter = await badgeDAO.getBadgesForUser(user.id)
    const badgesAwarded = badgesAfter
    .filter(
      (badgeAfter) => !badgesBefore.some((badgeBefore) => badgeBefore.badge.id === badgeAfter.badge.id)
    )
    .map((badge) => ({
      id: badge.badge.id,
      name: badge.badge.name,
      description: badge.badge.description,
      activeUrl: badge.badge.active_url,
    }))

    const notificationMessage = {
      level:{
      type: 'challenge_completed',
      xpGained,
      levelUp,
      previousLevel,
      newLevel,
      message: levelUp
        ? `Congratulations! You've completed the challenge, earned ${xpGained} XP, and reached Level ${newLevel}!`
        : `Challenge completed! You've earned ${xpGained} XP.`,},
        badgesAwarded,
    }
    return {
      userChallenge: checkIn,
      notification: notificationMessage,
    }
  },
}
