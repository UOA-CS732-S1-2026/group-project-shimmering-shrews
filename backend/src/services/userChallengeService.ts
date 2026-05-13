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
import {
  getNextStartOfUserCalendarDay,
  getStartOfUserCalendarDay,
} from '../utils/streak'
import { DAILY_CHALLENGE_LIMIT, filterChallengesByRadius } from './challengeService'
import { getXpForLevelStart, getXpRequiredForNextLevel } from '../utils/leveling'

// Converts degrees to radians for use in distance calculations.
const toRad = (deg: number) => (deg * Math.PI) / 180

// Calculates the distance in metres between two GPS coordinates using the Haversine formula.
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

// Returns all user challenges for the authenticated user.
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

// Returns a single user challenge by ID, scoped to the authenticated user.
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
  // Returns today's challenges for the user based on their location and radius.
  // Expires any unfinished challenges from previous days, then creates new ones if none exist for today.
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
    // Use the user's local timezone to determine the correct day boundaries
    const todayStart = getStartOfUserCalendarDay(now, timeZone)
    const tomorrowStart = getNextStartOfUserCalendarDay(now, timeZone)

    // Expire any challenges from previous days that are still open
    await userChallengeDAO.expireOpenChallengesBeforeDate(user.id, todayStart)

    let userChallenges = await userChallengeDAO.getTodayUserChallengesByUserId(
      user.id,
      todayStart,
      tomorrowStart
    )

    if (userChallenges.length === 0) {
      const allChallenges = await findAllActiveChallenges()
      const nearbyChallenges = filterChallengesByRadius(allChallenges, lat, lng, radiusKm)
      // Limit to the configured daily challenge cap
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

  // Marks a user challenge as accepted, recording the user's location at the time of acceptance.
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

  // Marks a user challenge as cancelled.
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

  // Checks in a user to a challenge, verifying they are within the required distance.
  // Awards XP, updates streak, and returns a notification object for level up or XP gain.
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

    // Return early if already completed — no notification needed
    if (userChallenge.status === 'completed') {
      return {
        userChallenge,
        notification: null,
      }
    }

    // Challenge must be accepted before it can be checked in
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

    // Reject check-in if user is too far from the challenge location
    if (distanceMeters > ALLOWED_COMPLETION_RADIUS_METERS) {
      throw new ApiError(
        409,
        `User is not within required distance to complete challenge (${Math.round(distanceMeters)}m away, must be within ${ALLOWED_COMPLETION_RADIUS_METERS}m)`
      )
    }

    // Fetch the user's current badges before check-in to detect newly awarded badges after completion
    const badgesBefore = await badgeDAO.getBadgesForUser(user.id)


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

    // No XP awarded — return without notification
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
    
    // Fetch badges after completion to compare with badges before
    const badgesAfter = await badgeDAO.getBadgesForUser(user.id)

    let badgesAwarded = null;

    if (badgesAfter && badgesBefore) {
      // Get IDs of badges the user had before check-in
      const beforeIds = new Set(
        badgesBefore
          .map(b => b.badge?.id)
          .filter(Boolean)
      );
      // Filter to only badges that were newly awarded during this check-in
      badgesAwarded = badgesAfter
      .filter((badgeAfter) => badgeAfter?.badge && !beforeIds.has(badgeAfter.badge.id))
      .map((badge) => ({
        id: badge.badge.id,
        name: badge.badge.name,
        description: badge.badge.description,
        activeUrl: badge.badge.active_url,
      }));
    }

    const previousLevelXpRequired = getXpRequiredForNextLevel(previousLevel)
    const nextLevelXpRequired = getXpRequiredForNextLevel(newLevel)
    const xpForLevelStart = getXpForLevelStart(previousLevel)
    const xpForNextLevelStart = getXpForLevelStart(newLevel)

    // Build notification payload for the frontend to display XP gain or level up message
    const notificationMessage = {
      level:{
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
        : `Challenge completed! You've earned ${xpGained} XP.`,},
        badgesAwarded,
    }

    return {
      userChallenge: checkIn,
      notification: notificationMessage,
    }
  },
}