import prisma from '../config/prisma'
import {
  generateExploratoryUsername,
  isExploratoryUsername,
} from '../utils/username'

type AuthProfileInput = {
  authId: string
  email: string
}

// Maximum number of attempts to generate a unique username before giving up.
const MAX_USERNAME_ATTEMPTS = 250

// Generates a unique exploratory-themed username for a user.
// Retries up to MAX_USERNAME_ATTEMPTS times if the generated username is already taken.
// Returns the existing username if it already belongs to the same user.
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

    // Accept the candidate if it's unclaimed or already belongs to this user
    if (!existingUser || existingUser.auth_id === authId) {
      return candidate
    }
  }

  throw new Error('Could not generate a unique username')
}

// Returns a user's profile by their Supabase auth ID.
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

// Syncs a user's profile with the database after login.
// Creates a new user record if one doesn't exist, or updates the username
// if the existing one is not in the exploratory format.
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

    // Replace non-exploratory usernames with a generated one
    if (!isExploratoryUsername(existingProfile.username)) {
      updateData.username = await findAvailableUsername(authId)
    }

    // No updates needed — return existing profile as is
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
  // Upsert to handle rare race conditions where two requests create the same user simultaneously
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

// Alias for syncUserProfileByAuth — kept for backwards compatibility.
export const upsertUserProfileByAuth = async (
  authId: string,
  email: string
) => {
  return syncUserProfileByAuth({ authId, email })
}

// Returns the total number of completed challenges for a user.
export const countCompletedChallengesByUserId = async (userId: number) => {
  return prisma.user_challenge.count({
    where: {
      user_id: userId,
      status: 'completed',
    },
  })
}

// Returns the 5 most recently completed challenges for a user, ordered by completion date.
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

// Returns all badges with a flag indicating whether the user has earned each one.
// Ordered by badge ID for consistent display order.
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
