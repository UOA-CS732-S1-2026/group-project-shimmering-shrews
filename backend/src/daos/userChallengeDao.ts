import type { Prisma } from '@prisma/client'
import prisma from '../config/prisma'

// Reusable select shape for user challenge queries, includes nested challenge and location data
const userChallengeSelect = {
  user_id: true,
  challenge_id: true,
  status: true,
  xp_worth: true,
  assigned_at: true,
  accepted_at: true,
  accepted_from_lat: true,
  accepted_from_lng: true,
  completed_at: true,
  cancelled_at: true,
  expired_at: true,
  skipped_at: true,
  id: true,
  challenge: {
    select: {
      id: true,
      name: true,
      description: true,
      xp_worth: true,
      challenge_category: {
        select: {
          id: true,
          name: true,
          icon: true,
        },
      },
      location: {
        select: {
          id: true,
          name: true,
          latitude: true,
          longitude: true,
        },
      },
    },
  },
} satisfies Prisma.user_challengeSelect

// Returns all user challenges for a given user.
export const findUserChallenges = async (userId: number) => {
  return prisma.user_challenge.findMany({
    where: { user_id: userId },
    select: userChallengeSelect,
  })
}

// Returns a single user challenge by its ID.
export const findUserChallenge = async (userChallengeId: number) => {
  return prisma.user_challenge.findFirst({
    where: {
      id: userChallengeId,
    },
    select: userChallengeSelect,
  })
}

// Returns a single user challenge by its ID, scoped to a specific user.
// Used to prevent users from accessing other users' challenges.
export const findUserChallengeForUser = async (userChallengeId: number, userId: number) => {
  return prisma.user_challenge.findFirst({
    where: {
      id: userChallengeId,
      user_id: userId,
    },
    select: userChallengeSelect,
  })
}

export const userChallengeDAO = {
  // Marks all in_progress or accepted challenges assigned before the cutoff date as expired.
  // Called at the start of each day to clean up yesterday's unfinished challenges.
  async expireOpenChallengesBeforeDate(userId: number, cutoffDate: Date) {
    return prisma.user_challenge.updateMany({
      where: {
        user_id: userId,
        assigned_at: {
          lt: cutoffDate,
        },
        status: {
          in: ['in_progress', 'accepted'],
        },
      },
      data: {
        status: 'expired',
        expired_at: cutoffDate,
        cancelled_at: null,
        skipped_at: null,
      },
    })
  },

  // Returns all challenges assigned to a user within a given day window.
  // Uses startOfDay and nextStartOfDay to handle timezone-aware day boundaries.
  async getTodayUserChallengesByUserId(
    userId: number,
    startOfDay: Date,
    nextStartOfDay: Date
  ) {
    return prisma.user_challenge.findMany({
      where: {
        user_id: userId,
        assigned_at: {
          gte: startOfDay,
          lt: nextStartOfDay,
        },
      },
      select: userChallengeSelect,
    })
  },

  // Assigns a set of challenges to a user for today, skipping any already assigned.
  async createTodayUserChallenges(
    userId: number,
    challenges: { id: number; xp_worth: number }[]
  ) {
    return prisma.user_challenge.createMany({
      data: challenges.map((challenge) => ({
        user_id: userId,
        challenge_id: challenge.id,
        status: 'in_progress',
        xp_worth: challenge.xp_worth,
      })),
      skipDuplicates: true,
    })
  },

  // Marks a user challenge as accepted, recording the user's location at the time of acceptance.
  // Returns the existing challenge unchanged if it is already completed or expired.
  async acceptUserChallenge(
    userChallengeId: number,
    userId: number,
    acceptedFromLat: number,
    acceptedFromLng: number
  ) {
    const userChallenge = await prisma.user_challenge.findFirst({
      where: {
        id: userChallengeId,
        user_id: userId,
      },
      select: userChallengeSelect,
    })

    if (!userChallenge) {
      return null
    }

    // Return unchanged if already in a terminal state
    if (userChallenge.status === 'completed' || userChallenge.status === 'expired') {
      return userChallenge
    }

    const acceptedAt = new Date()

    return prisma.user_challenge.update({
      where: {
        id: userChallengeId,
      },
      data: {
        status: 'accepted',
        accepted_at: acceptedAt,
        accepted_from_lat: acceptedFromLat,
        accepted_from_lng: acceptedFromLng,
        cancelled_at: null,
        expired_at: null,
      },
      select: userChallengeSelect,
    })
  },

  // Marks a user challenge as cancelled.
  // Returns the existing challenge unchanged if it is already completed, cancelled, or expired.
  async cancelUserChallenge(userChallengeId: number, userId: number) {
    const userChallenge = await prisma.user_challenge.findFirst({
      where: {
        id: userChallengeId,
        user_id: userId,
      },
    })

    if (!userChallenge) {
      return null
    }

    // Return unchanged if already in a terminal state
    if (
      userChallenge.status === 'completed' ||
      userChallenge.status === 'cancelled' ||
      userChallenge.status === 'expired'
    ) {
      return prisma.user_challenge.findFirst({
        where: {
          id: userChallengeId,
          user_id: userId,
        },
        select: userChallengeSelect,
      })
    }

    return prisma.user_challenge.update({
      where: {
        id: userChallengeId,
      },
      data: {
        status: 'cancelled',
        cancelled_at: new Date(),
        expired_at: null,
      },
      select: userChallengeSelect,
    })
  },
}
