import prisma from '../config/prisma'
import {
  generateExploratoryUsername,
  isExploratoryUsername,
} from '../utils/username'

type AuthProfileInput = {
  authId: string
  email: string
}

const MAX_USERNAME_ATTEMPTS = 250

const findAvailableUsername = async (authId: string) => {
  for (let attempt = 1; attempt <= MAX_USERNAME_ATTEMPTS; attempt += 1) {
    const candidate = generateExploratoryUsername()
    const existingUser = await prisma.users.findUnique({
      where: {
        username: candidate,
      },
      select: {
        auth_id: true,
      },
    })

    if (!existingUser || existingUser.auth_id === authId) {
      return candidate
    }
  }

  throw new Error('Could not generate a unique username')
}

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
      last_completed_challenge: true,
    },
  })
}

export const syncUserProfileByAuth = async ({
  authId,
  email,
}: AuthProfileInput) => {
  const existingProfile = await prisma.users.findUnique({
    where: {
      auth_id: authId,
    },
    select: {
      id: true,
      username: true,
      email: true,
      level: true,
      xp_earned: true,
      streak_count: true,
      last_completed_challenge: true,
    },
  })

  if (existingProfile) {
    const updateData: {
      username?: string
    } = {}

    if (!isExploratoryUsername(existingProfile.username)) {
      updateData.username = await findAvailableUsername(authId)
    }

    if (!updateData.username) {
      return existingProfile
    }

    return prisma.users.update({
      where: {
        auth_id: authId,
      },
      data: updateData,
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        xp_earned: true,
        streak_count: true,
        last_completed_challenge: true,
      },
    })
  }

  const username = await findAvailableUsername(authId)

  return prisma.users.upsert({
    where: {
      auth_id: authId,
    },
    update: {},
    create: {
      auth_id: authId,
      email,
      username,
      user_role: 'user',
    },
    select: {
      id: true,
      username: true,
      email: true,
      level: true,
      xp_earned: true,
      streak_count: true,
      last_completed_challenge: true,
    },
  })
}

export const upsertUserProfileByAuth = async (
  authId: string,
  email: string
) => {
  return syncUserProfileByAuth({ authId, email })
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
