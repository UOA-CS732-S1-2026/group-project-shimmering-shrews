import { beforeAll, afterAll, describe, expect, it } from 'vitest'
import { PrismaClient } from '@prisma/client'
import { disconnectSeedDatabase, seedDatabase } from '../prisma/seed'

const describeIf = process.env.RUN_INTEGRATION ? describe : describe.skip

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

  it('seeds the badge catalog and criteria idempotently', async () => {
    await seedDatabase()

    await expect(prisma.badge.count()).resolves.toBe(6)
    await expect(prisma.badge_criteria.count()).resolves.toBe(6)
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
})
