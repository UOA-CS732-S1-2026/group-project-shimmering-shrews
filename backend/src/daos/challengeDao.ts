import prisma from '../config/prisma'
import type { Prisma } from '@prisma/client'

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
  const challenge = await prisma.challenge.findFirst({
    where: {
      id: challengeId,
      is_active: true,
    },
    select: {
      id: true,
      xp_worth: true,
    },
  })

  if (!challenge) {
    return null
  }

  return prisma.user_challenge.upsert({
    where: {
      user_id_challenge_id: {
        user_id: userId,
        challenge_id: challengeId,
      },
    },
    update: {
      status: 'completed',
      completed_at: new Date(),
      skipped_at: null,
      xp_worth: challenge.xp_worth,
    },
    create: {
      user_id: userId,
      challenge_id: challengeId,
      status: 'completed',
      completed_at: new Date(),
      xp_worth: challenge.xp_worth,
    },
  })
}
