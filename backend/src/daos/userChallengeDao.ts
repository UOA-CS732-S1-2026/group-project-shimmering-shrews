import prisma from '../config/prisma'
import type { Prisma } from '@prisma/client'

const userChallengeSelect = {
  user_id: true,
  challenge_id: true,
  status: true,
  xp_worth: true,
  assigned_at: true,
  completed_at: true,
  skipped_at: true,
  assigned_date: true,
  id: true,
  challenge: {
    include: {
      challenge_category: true,
      location: true,
    }
  },
} satisfies Prisma.user_challengeSelect

export const findUserChallenges = async (userId: number) => {
  return prisma.user_challenge.findMany({
    where: { user_id: userId },
    select: userChallengeSelect,
  })
}

export const findUserChallenge = async (userChallengeId: number) => {
  return prisma.user_challenge.findFirst({
    where: {
      id: userChallengeId,
    },
    select: userChallengeSelect,
  })
}

export const userChallengeDAO = {
  async getTodayUserChallengesByUserId(userId: number, today: Date) {
    return prisma.user_challenge.findMany({
      where: {
        user_id: userId,
        assigned_date: today,
      },
      include: {
        challenge: {
          include: {
            challenge_category: true,
            location: true,
          },
        },
      },
    })
  },

  async createTodayUserChallenges(
    userId: number,
    challenges: { id: number; xp_worth: number }[],
    today: Date
  ) {
    return prisma.user_challenge.createMany({
      data: challenges.map((challenge) => ({
        user_id: userId,
        challenge_id: challenge.id,
        assigned_date: today,
        status: "in_progress",
        xp_worth: challenge.xp_worth,
      })),
      skipDuplicates: true,
    })
  },
}
