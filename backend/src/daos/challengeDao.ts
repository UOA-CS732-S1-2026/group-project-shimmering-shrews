import prisma from '../config/prisma'
import type { Prisma } from '@prisma/client'

const XP_PER_LEVEL = 500
const MS_PER_DAY = 1000 * 60 * 60 * 24

const startOfUtcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

const calculateNextStreakCount = (
  lastCompletedChallenge: Date | null,
  currentStreakCount: number,
  completedAt: Date
) => {
  if (!lastCompletedChallenge) {
    return 1
  }

  const dayDifference = Math.floor(
    (startOfUtcDay(completedAt) - startOfUtcDay(lastCompletedChallenge)) / MS_PER_DAY
  )

  if (dayDifference <= 0) {
    return Math.max(currentStreakCount, 1)
  }

  if (dayDifference === 1) {
    return currentStreakCount + 1
  }

  return 1
}

const calculateLevel = (xpEarned: number) => Math.floor(xpEarned / XP_PER_LEVEL) + 1

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

export const completeUserChallenge = async (challengeId: number, userId: number) => {
  return prisma.$transaction(async (tx) => {
    const [challenge, user] = await Promise.all([
      tx.challenge.findFirst({
        where: { id: challengeId, is_active: true },
        select: { id: true, xp_worth: true },
      }),
      tx.users.findUnique({
        where: { id: userId},
        select: { xp_earned: true, level: true, streak_count: true, last_completed_challenge: true },
      }),
    ])

    if (!challenge || !user) return null

    const latestUserChallenge = await tx.user_challenge.findFirst({
      where: {
        user_id: userId,
        challenge_id: challengeId,
      },
      orderBy: {
        assigned_date: 'desc',
      },
    })

    if (!latestUserChallenge) return null

    if (latestUserChallenge.status === 'completed') return null

    const completedAt = new Date()

    const nextXpEarned = user.xp_earned + (latestUserChallenge.xp_worth ?? challenge.xp_worth)

    const nextStreakCount = calculateNextStreakCount( user.last_completed_challenge, user.streak_count, completedAt )

    const completedUserChallenge = await tx.user_challenge.update({
      where: {
        user_id_challenge_id_assigned_date: {
          user_id: latestUserChallenge.user_id,
          challenge_id: latestUserChallenge.challenge_id,
          assigned_date: latestUserChallenge.assigned_date,
        },
      },
      data: {
        status: 'completed',
        completed_at: completedAt,
        xp_worth: latestUserChallenge.xp_worth,
      }
    });

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
