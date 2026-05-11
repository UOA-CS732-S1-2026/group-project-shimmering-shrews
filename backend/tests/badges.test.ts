import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { disconnectSeedDatabase, seedDatabase } from '../prisma/seed'

/**
 * Test category: Integration tests.
 *
 * These tests exercise the real Postgres schema, seed data, stat trigger,
 * badge trigger, transaction rollback behavior, and concurrent writes. They are
 * intentionally excluded from the default unit/contract test path because
 * tests/setup.ts applies sql_scripts/schema.sql, which drops and recreates the
 * public schema.
 *
 * Run only against a disposable test database:
 *   RUN_INTEGRATION=1 ALLOW_DB_RESET=1 TEST_DATABASE_URL=postgresql://... npm run test:integration
 */
const describeIf = process.env.RUN_INTEGRATION === '1' ? describe : describe.skip

describeIf('badge database flow', () => {
  let prisma: PrismaClient

  beforeAll(async () => {
    prisma = new PrismaClient()
    await seedDatabase()
  })

  afterAll(async () => {
    await prisma.$disconnect()
    await disconnectSeedDatabase()
  })

  const createUser = async (suffix: string) => {
    return prisma.users.create({
      data: {
        username: `City_Scout-${suffix}`,
        email: `badge-${suffix}@example.com`,
        user_role: 'user',
        auth_id: `badge-auth-${suffix}`,
      },
    })
  }

  const completeChallenge = async (userId: number, challengeId: number) => {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { xp_worth: true },
    })
    const assigned = await prisma.user_challenge.create({
      data: {
        user_id: userId,
        challenge_id: challengeId,
        status: 'accepted',
        xp_worth: challenge.xp_worth,
      },
    })

    return prisma.user_challenge.update({
      where: { id: assigned.id },
      data: {
        status: 'completed',
        completed_at: new Date(),
      },
    })
  }

  const createAcceptedUserChallenge = async (userId: number, challengeId: number) => {
    const challenge = await prisma.challenge.findUniqueOrThrow({
      where: { id: challengeId },
      select: { xp_worth: true },
    })

    return prisma.user_challenge.create({
      data: {
        user_id: userId,
        challenge_id: challengeId,
        status: 'accepted',
        xp_worth: challenge.xp_worth,
      },
    })
  }

  it('seeds the badge catalog, criteria, and sequences idempotently', async () => {
    await seedDatabase()
    await seedDatabase()

    await expect(prisma.challenge_category.count()).resolves.toBe(5)
    await expect(prisma.badge.count()).resolves.toBe(6)
    await expect(prisma.badge_criteria.count()).resolves.toBe(6)
    await expect(prisma.location.count()).resolves.toBe(6)
    await expect(prisma.challenge.count()).resolves.toBe(7)
    await expect(
      prisma.badge.findMany({
        orderBy: { id: 'asc' },
        select: { id: true, name: true },
      })
    ).resolves.toEqual([
      { id: 1, name: 'Explorer' },
      { id: 2, name: 'Ice Breaker' },
      { id: 3, name: 'Nature Novice' },
      { id: 4, name: 'Getting Moving' },
      { id: 5, name: 'Flavour Seeker' },
      { id: 6, name: 'Local Legend' },
    ])

    const tempCategoryName = 'Temporary Seed Sequence Category'
    const tempBadgeName = 'Temporary Seed Sequence Badge'

    try {
      const category = await prisma.challenge_category.create({
        data: { name: tempCategoryName },
      })
      const badge = await prisma.badge.create({
        data: {
          name: tempBadgeName,
          description: 'Temporary badge used to verify sequence state',
          active_url: '/badges/temp.svg',
          inactive_url: '/badges/temp.svg',
        },
      })

      expect(category.id).toBeGreaterThan(4)
      expect(badge.id).toBeGreaterThan(6)
    } finally {
      await prisma.badge.deleteMany({ where: { name: tempBadgeName } })
      await prisma.challenge_category.deleteMany({ where: { name: tempCategoryName } })
    }
  })

  it('awards a category badge when a matching challenge is completed', async () => {
    const user = await createUser('31')
    const foodChallenge = await prisma.challenge.findFirstOrThrow({
      where: { category_id: 1 },
      select: { id: true },
    })

    await completeChallenge(user.id, foodChallenge.id)

    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: 1,
          name: 'category_challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 1 })

    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })

    await expect(
      prisma.awarded_badge.findFirst({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toMatchObject({ user_id: user.id, badge_id: flavourSeeker.id })
  })

  it('fires the badge trigger when user_stat reaches badge criteria directly', async () => {
    const user = await createUser('36')
    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })

    await prisma.user_stat.create({
      data: {
        user_id: user.id,
        category_id: 1,
        name: 'category_challenges_completed',
        current_value: 1,
      },
    })

    await expect(
      prisma.awarded_badge.findFirst({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toMatchObject({ user_id: user.id, badge_id: flavourSeeker.id })
  })

  it('rolls back badge awards when the stat transaction rolls back', async () => {
    const user = await createUser('37')
    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })

    await expect(
      prisma.$transaction(async (tx) => {
        await tx.user_stat.create({
          data: {
            user_id: user.id,
            category_id: 1,
            name: 'category_challenges_completed',
            current_value: 1,
          },
        })

        throw new Error('force rollback')
      })
    ).rejects.toThrow('force rollback')

    await expect(
      prisma.user_stat.count({
        where: {
          user_id: user.id,
          category_id: 1,
          name: 'category_challenges_completed',
        },
      })
    ).resolves.toBe(0)

    await expect(
      prisma.awarded_badge.count({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toBe(0)
  })

  it('awards the global Explorer badge after three completed challenges', async () => {
    const user = await createUser('32')
    const challenges = await prisma.challenge.findMany({
      take: 3,
      orderBy: { id: 'asc' },
      select: { id: true },
    })

    for (const challenge of challenges) {
      await completeChallenge(user.id, challenge.id)
    }

    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: 0,
          name: 'challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 3 })

    const explorer = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Explorer' },
    })

    await expect(
      prisma.awarded_badge.findFirst({
        where: {
          user_id: user.id,
          badge_id: explorer.id,
        },
      })
    ).resolves.toMatchObject({ user_id: user.id, badge_id: explorer.id })
  })

  it('does not double-count stats or duplicate badges when a completed challenge is saved again', async () => {
    const user = await createUser('33')
    const foodChallenge = await prisma.challenge.findFirstOrThrow({
      where: { category_id: 1 },
      select: { id: true },
    })
    const completed = await completeChallenge(user.id, foodChallenge.id)

    await prisma.user_challenge.update({
      where: { id: completed.id },
      data: { status: 'completed' },
    })

    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: 1,
          name: 'category_challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 1 })

    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })
    await expect(
      prisma.awarded_badge.count({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toBe(1)
  })

  it('does not double-count stats or duplicate badges for concurrent completion updates', async () => {
    const user = await createUser('34')
    const foodChallenge = await prisma.challenge.findFirstOrThrow({
      where: { category_id: 1 },
      select: { id: true },
    })
    const assignment = await createAcceptedUserChallenge(user.id, foodChallenge.id)

    const results = await Promise.allSettled([
      prisma.user_challenge.update({
        where: { id: assignment.id },
        data: { status: 'completed', completed_at: new Date() },
      }),
      prisma.user_challenge.update({
        where: { id: assignment.id },
        data: { status: 'completed', completed_at: new Date() },
      }),
    ])

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true)
    await expect(
      prisma.user_stat.findFirst({
        where: {
          user_id: user.id,
          category_id: 1,
          name: 'category_challenges_completed',
        },
      })
    ).resolves.toMatchObject({ current_value: 1 })

    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })

    await expect(
      prisma.awarded_badge.count({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toBe(1)
  })

  it('does not duplicate badge awards for concurrent stat updates that meet criteria', async () => {
    const user = await createUser('35')
    const stat = await prisma.user_stat.create({
      data: {
        user_id: user.id,
        category_id: 1,
        name: 'category_challenges_completed',
        current_value: 0,
      },
    })

    const results = await Promise.allSettled([
      prisma.user_stat.update({
        where: { id: stat.id },
        data: { current_value: 1 },
      }),
      prisma.user_stat.update({
        where: { id: stat.id },
        data: { current_value: 1 },
      }),
    ])

    expect(results.every((result) => result.status === 'fulfilled')).toBe(true)

    const flavourSeeker = await prisma.badge.findUniqueOrThrow({
      where: { name: 'Flavour Seeker' },
    })

    await expect(
      prisma.awarded_badge.count({
        where: {
          user_id: user.id,
          badge_id: flavourSeeker.id,
        },
      })
    ).resolves.toBe(1)
  })
})
