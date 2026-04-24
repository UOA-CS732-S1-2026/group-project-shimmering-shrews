import prisma from '../config/prisma'
import { buildUsernameFromAuth } from '../utils/username'

export const findUserProfileByAuthId = async (authId: string) => {
  return prisma.users.findUnique({
    where: {
      auth_id: authId,
    },
    select: {
      id: true,
      username: true,
      level: true,
      xp_earned: true,
      streak_count: true,
    },
  })
}

export const upsertUserProfileByAuth = async (authId: string, email: string) => {
  return prisma.users.upsert({
    where: {
      auth_id: authId,
    },
    update: {},
    create: {
      auth_id: authId,
      email,
      username: buildUsernameFromAuth(email, authId),
      user_role: 'user',
    },
    select: {
      id: true,
      username: true,
      level: true,
      xp_earned: true,
      streak_count: true,
    },
  })
}

export const countCompletedChallengesByUserId = async (userId: number) => {
  return prisma.user_challenge.count({
    where: {
      user_id: userId,
      status: 'completed',
    },
  })
}

export const findRecentCompletedChallengesByUserId = async (userId: number) => {
  return prisma.user_challenge.findMany({
    where: {
      user_id: userId,
      status: 'completed',
    },
    orderBy: {
      completed_at: 'desc',
    },
    take: 5,
    select: {
      challenge_id: true,
      xp_worth: true,
      completed_at: true,
      challenge: {
        select: {
          name: true,
          description: true,
        },
      },
    },
  })
}

export const findBadgesByUserId = async (userId: number) => {
  return prisma.badge.findMany({
    orderBy: {
      id: 'asc',
    },
    select: {
      id: true,
      name: true,
      description: true,
      active_url: true,
      inactive_url: true,
      awarded_badge: {
        where: {
          user_id: userId,
        },
        select: {
          user_id: true,
        },
      },
    },
  })
}
