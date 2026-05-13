import prisma from '../config/prisma'
import type { Prisma } from '@prisma/client'
import { calculateLevel } from '../utils/leveling'
import { calculateNextStreakCount } from '../utils/streak'

// Streak calculation is kept as a pure utility and imported here so timezone
// edge cases can be unit-tested without running a database transaction, while
// the DAO still applies the tested result atomically with completion updates.
const challengeSelect = {
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
} satisfies Prisma.challengeSelect

const userChallengeResponseSelect = {
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
      is_active: true,
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

export const findAllActiveChallenges = async () => {
  return prisma.challenge.findMany({
    where: {
      is_active: true,
    },
    select: challengeSelect,
  })
}

export const findActiveChallengeById = async (id: number) => {
  return prisma.challenge.findFirst({
    where: {
      id,
      is_active: true,
    },
    select: challengeSelect,
  })
}

// export const findActiveChallengesByCategory = async () => {
//   const categories = await prisma.challenge_category.findMany({
//     select: {
//       id: true,
//       name: true,
//     },
//   })

//   const challenges = await Promise.all(
//     categories.map((category) =>
//       prisma.challenge.findFirst({
//         where: {
//           is_active: true,
//           challenge_category_id: category.id,
//         },
//         select: challengeSelect,
//       })
//     )
//   )

//   return challenges.filter((challenge) => challenge !== null)
// }

export const findChallengeCategoriesByNames = async (names: string[]) => {
  return prisma.challenge_category.findMany({
    where: {
      name: {
        in: names,
      },
    },
    select: {
      id: true,
      name: true,
    },
  })
}

export const createChallenges = async (data: Prisma.challengeCreateManyInput[]) => {
  return prisma.challenge.createMany({
    data,
    skipDuplicates: true,
  })
}

export const completeUserChallenge = async (
  challengeId: number,
  userId: number,
  timeZone?: string
) => {
  return prisma.$transaction(async (tx) => {
    const [challenge, user] = await Promise.all([
      tx.challenge.findFirst({
        where: { id: challengeId, is_active: true },
        select: { id: true, xp_worth: true },
      }),
      tx.users.findUnique({
        where: { id: userId },
        select: {
          id: true,
          xp_earned: true,
          level: true,
          streak_count: true,
          last_completed_challenge: true,
        },
      }),
    ])

    if (!challenge || !user) return null

    const latestUserChallenge = await tx.user_challenge.findFirst({
      where: {
        user_id: userId,
        challenge_id: challengeId,
      },
      orderBy: {
        assigned_at: 'desc',
      },
    })

    if (!latestUserChallenge) return null

    if (latestUserChallenge.status === 'completed') {
      return latestUserChallenge
    }

    if (latestUserChallenge.status !== 'accepted') {
      return null
    }

    const completedAt = new Date()

    const nextXpEarned = user.xp_earned + (latestUserChallenge.xp_worth ?? challenge.xp_worth)

    const nextStreakCount = calculateNextStreakCount(
      user.last_completed_challenge,
      user.streak_count,
      completedAt,
      timeZone
    )

    const completedUserChallenge = await tx.user_challenge.update({
      where: {
        id: latestUserChallenge.id,
      },
      data: {
        status: 'completed',
        completed_at: completedAt,
        skipped_at: null,
        expired_at: null,
        xp_worth: latestUserChallenge.xp_worth ?? challenge.xp_worth,
      },
    })

    await tx.users.update({
      where: { id: userId },
      data: {
        xp_earned: nextXpEarned,
        level: calculateLevel(nextXpEarned),
        streak_count: nextStreakCount,
        last_completed_challenge: completedAt,
      },
    })

    return completedUserChallenge
  })
}

export const completeUserChallengeByUserChallengeId = async (
  userChallengeId: number,
  userId: number,
  timeZone?: string
) => {
  return prisma.$transaction(async (tx) => {
    const userChallenge = await tx.user_challenge.findFirst({
      where: {
        id: userChallengeId,
        user_id: userId,
      },
      select: userChallengeResponseSelect,
    })

    const user = await tx.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        xp_earned: true,
        level: true,
        streak_count: true,
        last_completed_challenge: true,
      },
    })

    if (!userChallenge || !user || !userChallenge.challenge.is_active) {
      return null
    }

    if (userChallenge.status === 'completed') {
      const previousUser = {
        id: user.id,
        xp_earned: user.xp_earned,
        level: user.level,
      }

      return {
        userChallenge,
        previousUser,
        updatedUser: previousUser,
        xpAwarded: 0,
      }
    }

    if (userChallenge.status !== 'accepted') {
      return null
    }

    const completedAt = new Date()
    const xpWorth = userChallenge.xp_worth ?? userChallenge.challenge.xp_worth
    const nextStreakCount = calculateNextStreakCount(
      user.last_completed_challenge,
      user.streak_count,
      completedAt,
      timeZone
    )

    const completionUpdate = await tx.user_challenge.updateMany({
      where: {
        id: userChallenge.id,
        user_id: userId,
        status: 'accepted',
      },
      data: {
        status: 'completed',
        completed_at: completedAt,
        skipped_at: null,
        cancelled_at: null,
        expired_at: null,
        xp_worth: xpWorth,
      },
    })

    if (completionUpdate.count === 0) {
      const [latestUserChallenge, latestUser] = await Promise.all([
        tx.user_challenge.findFirst({
          where: {
            id: userChallengeId,
            user_id: userId,
          },
          select: userChallengeResponseSelect,
        }),
        tx.users.findUnique({
          where: { id: userId },
          select: {
            id: true,
            xp_earned: true,
            level: true,
          },
        }),
      ])

      if (!latestUserChallenge || !latestUser) {
        return null
      }

      return {
        userChallenge: latestUserChallenge,
        previousUser: latestUser,
        updatedUser: latestUser,
        xpAwarded: 0,
      }
    }

    const completedUserChallenge = await tx.user_challenge.findFirst({
      where: {
        id: userChallenge.id,
        user_id: userId,
      },
      select: userChallengeResponseSelect,
    })

    if (!completedUserChallenge) {
      return null
    }

    const userAfterXp = await tx.users.update({
      where: { id: userId },
      data: {
        xp_earned: {
          increment: xpWorth,
        },
        streak_count: nextStreakCount,
        last_completed_challenge: completedAt,
      },
      select: {
        id: true,
        xp_earned: true,
      },
    })

    const previousXpEarned = userAfterXp.xp_earned - xpWorth
    const updatedUser = await tx.users.update({
      where: { id: userId },
      data: {
        level: calculateLevel(userAfterXp.xp_earned),
      },
      select: {
        id: true,
        xp_earned: true,
        level: true,
      },
    })

    return {
      userChallenge: completedUserChallenge,
      previousUser: {
        id: user.id,
        xp_earned: previousXpEarned,
        level: calculateLevel(previousXpEarned),
      },
      updatedUser,
      xpAwarded: xpWorth,
    }
  },
  {
    timeout: 20000
  })
}
