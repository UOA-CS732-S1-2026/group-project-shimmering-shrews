import { afterAll, beforeEach, describe, expect, it } from 'vitest'

import prisma from '../src/config/prisma'
import { syncUserProfileByAuth, findUserProfileByAuthId } from '../src/daos/profileDao'
import { userDAO } from '../src/daos/userDao'
import { userChallengeService } from '../src/services/userChallengeService'
import { getStartOfUserCalendarDay } from '../src/utils/streak'

/**
 * Test category: Database integration tests.
 *
 * These tests exercise the real Postgres schema through DAO/service code. They
 * are skipped in the default unit test run because tests/setup.ts resets the
 * public schema through Prisma when RUN_INTEGRATION=1 and ALLOW_DB_RESET=1 are set.
 */
const describeIntegration = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip

const uniqueSuffix = () => `${Date.now()}-${Math.random().toString(16).slice(2)}`

const resetAppData = () =>
  prisma.$executeRaw`
    TRUNCATE TABLE
      awarded_badge,
      user_stat,
      user_challenge,
      badge_criteria,
      challenge,
      location,
      badge,
      challenge_category,
      users
    RESTART IDENTITY CASCADE
  `

const ensureGlobalCategory = () =>
  prisma.challenge_category.upsert({
    where: { id: 0 },
    update: { name: 'Global', icon: null },
    create: { id: 0, name: 'Global', icon: null },
  })

const createUser = (suffix = uniqueSuffix()) =>
  prisma.users.create({
    data: {
      username: `db-user-${suffix}`,
      email: `db-user-${suffix}@example.com`,
      user_role: 'user',
      auth_id: `db-auth-${suffix}`,
    },
  })

const createCategory = (suffix = uniqueSuffix()) =>
  prisma.challenge_category.create({
    data: {
      name: `DB Category ${suffix}`,
    },
  })

const createLocation = (
  suffix: string,
  latitude = -36.8485,
  longitude = 174.7633
) =>
  prisma.location.create({
    data: {
      name: `DB Location ${suffix}`,
      category: 'park',
      latitude,
      longitude,
    },
  })

const createChallenge = async (
  suffix = uniqueSuffix(),
  options: {
    categoryId?: number
    latitude?: number
    longitude?: number
    isActive?: boolean
    xpWorth?: number
  } = {}
) => {
  const category =
    options.categoryId == null ? await createCategory(suffix) : { id: options.categoryId }
  const location = await createLocation(suffix, options.latitude, options.longitude)

  return prisma.challenge.create({
    data: {
      name: `DB Challenge ${suffix}`,
      location_id: location.id,
      category_id: category.id,
      xp_worth: options.xpWorth ?? 25,
      is_active: options.isActive ?? true,
    },
  })
}

describeIntegration('database-backed DAO and service flows', () => {
  beforeEach(async () => {
    await resetAppData()
  })

  afterAll(async () => {
    await prisma.$disconnect()
  })

  it('persists and reads authenticated profiles through the profile and user DAOs', async () => {
    const suffix = uniqueSuffix()
    const authId = `profile-auth-${suffix}`
    const email = `profile-${suffix}@example.com`

    const createdProfile = await syncUserProfileByAuth({ authId, email })
    const user = await userDAO.getUserByAuthId(authId)
    const profile = await findUserProfileByAuthId(authId)
    const syncedAgain = await syncUserProfileByAuth({ authId, email })

    expect(user).toEqual({ id: createdProfile.id, level: 1, xp_earned: 0 })
    expect(profile).toMatchObject({
      id: createdProfile.id,
      username: createdProfile.username,
      level: 1,
      xp_earned: 0,
      streak_count: 0,
      last_completed_challenge: null,
    })
    expect(syncedAgain.id).toBe(createdProfile.id)
    await expect(prisma.users.count({ where: { auth_id: authId } })).resolves.toBe(1)
  })

  it('creates nearby daily challenges and expires stale open assignments', async () => {
    const suffix = uniqueSuffix()
    const user = await createUser(suffix)
    const category = await createCategory(suffix)
    const todayStart = getStartOfUserCalendarDay(new Date(), 'Pacific/Auckland')
    const staleAssignedAt = new Date(todayStart.getTime() - 60_000)

    const nearbyChallengeA = await createChallenge(`${suffix}-near-a`, {
      categoryId: category.id,
      latitude: -36.8485,
      longitude: 174.7633,
      xpWorth: 10,
    })
    const nearbyChallengeB = await createChallenge(`${suffix}-near-b`, {
      categoryId: category.id,
      latitude: -36.849,
      longitude: 174.764,
      xpWorth: 20,
    })
    await createChallenge(`${suffix}-far`, {
      categoryId: category.id,
      latitude: 0,
      longitude: 0,
      xpWorth: 30,
    })
    await createChallenge(`${suffix}-inactive`, {
      categoryId: category.id,
      latitude: -36.8486,
      longitude: 174.7634,
      isActive: false,
      xpWorth: 40,
    })

    const staleChallenge = await createChallenge(`${suffix}-stale`, {
      categoryId: category.id,
      latitude: -36.8485,
      longitude: 174.7633,
    })
    const staleAssignment = await prisma.user_challenge.create({
      data: {
        user_id: user.id,
        challenge_id: staleChallenge.id,
        status: 'accepted',
        xp_worth: staleChallenge.xp_worth,
        assigned_at: staleAssignedAt,
      },
    })

    const todayChallenges = await userChallengeService.getOrCreateTodayChallenges(
      user.auth_id,
      -36.8485,
      174.7633,
      1,
      'Pacific/Auckland'
    )

    expect(todayChallenges.map((challenge) => challenge.challenge_id).sort()).toEqual(
      [nearbyChallengeA.id, nearbyChallengeB.id, staleChallenge.id].sort()
    )
    expect(todayChallenges.every((challenge) => challenge.status === 'in_progress')).toBe(true)

    const expiredAssignment = await prisma.user_challenge.findUniqueOrThrow({
      where: { id: staleAssignment.id },
    })
    expect(expiredAssignment.status).toBe('expired')
    expect(expiredAssignment.expired_at?.getTime()).toBeGreaterThan(
      staleAssignedAt.getTime()
    )

    await userChallengeService.getOrCreateTodayChallenges(
      user.auth_id,
      -36.8485,
      174.7633,
      1,
      'Pacific/Auckland'
    )

    await expect(
      prisma.user_challenge.count({
        where: {
          user_id: user.id,
          assigned_at: {
            gte: todayStart,
          },
        },
      })
    ).resolves.toBe(3)
  })

  it('accepts and checks in a user challenge, updating progress and trigger-backed stats', async () => {
    const suffix = uniqueSuffix()
    await ensureGlobalCategory()
    const user = await createUser(suffix)
    const category = await createCategory(suffix)
    const challenge = await createChallenge(`${suffix}-checkin`, {
      categoryId: category.id,
      latitude: -36.8485,
      longitude: 174.7633,
      xpWorth: 40,
    })
    const assignment = await prisma.user_challenge.create({
      data: {
        user_id: user.id,
        challenge_id: challenge.id,
        status: 'in_progress',
        xp_worth: challenge.xp_worth,
      },
    })

    const accepted = await userChallengeService.acceptChallenge(
      user.auth_id,
      assignment.id,
      -36.8485,
      174.7633
    )

    expect(accepted.status).toBe('accepted')
    expect(Number(accepted.accepted_from_lat)).toBeCloseTo(-36.8485)
    expect(Number(accepted.accepted_from_lng)).toBeCloseTo(174.7633)
    expect(accepted.accepted_at).toBeInstanceOf(Date)

    const completed = await userChallengeService.checkInChallenge(
      user.auth_id,
      assignment.id,
      -36.8485,
      174.7633,
      'Pacific/Auckland'
    )

    expect(completed.userChallenge.status).toBe('completed')
    expect(completed.userChallenge.completed_at).toBeInstanceOf(Date)

    const updatedUser = await prisma.users.findUniqueOrThrow({
      where: { id: user.id },
      select: {
        xp_earned: true,
        level: true,
        streak_count: true,
        last_completed_challenge: true,
      },
    })

    expect(updatedUser).toMatchObject({
      xp_earned: 40,
      level: 2,
      streak_count: 1,
    })
    expect(updatedUser.last_completed_challenge).toBeInstanceOf(Date)

    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: 0,
          name: 'challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 1 })

    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: category.id,
          name: 'category_challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 1 })
  })
})
