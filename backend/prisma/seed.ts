import "dotenv/config";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
type ChallengeCategory = Awaited<ReturnType<typeof prisma.challenge_category.findMany>>[number]

async function main() {
  console.log('Seeding database.')

  // 1. Seed challenge categories safely
  const categorySeeds = [
    { id: 0, name: 'Global', icon: null },
    { id: 1, name: 'Food', icon: '🍔' },
    { id: 2, name: 'Fitness', icon: '🏃' },
    { id: 3, name: 'Social', icon: '👥' },
    { id: 4, name: 'Nature', icon: '🌲' },
  ]

  for (const category of categorySeeds) {
    await prisma.challenge_category.upsert({
      where: { id: category.id },
      update: {
        name: category.name,
        icon: category.icon,
      },
      create: category,
    })
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('challenge_category', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM challenge_category), 1),
      true
    )
  `

  const categories = await prisma.challenge_category.findMany()
  const foodCategory = categories.find((c: ChallengeCategory) => c.name === 'Food')
  const fitnessCategory = categories.find((c: ChallengeCategory) => c.name === 'Fitness')
  const socialCategory = categories.find((c: ChallengeCategory) => c.name === 'Social')
  const natureCategory = categories.find((c: ChallengeCategory) => c.name === 'Nature')

  if (!foodCategory || !fitnessCategory || !socialCategory || !natureCategory) {
    throw new Error('Failed to seed challenge categories')
  }

  // 2. Seed badges and criteria safely
  const badgeSeeds = [
    {
      id: 1,
      name: 'Explorer',
      description: 'Completed 3 challenges',
      active_url: '/badges/generic_award.svg',
      inactive_url: '/badges/generic_award.svg',
    },
    {
      id: 2,
      name: 'Ice Breaker',
      description: 'Complete a social challenge',
      active_url: '/badges/social_badge.svg',
      inactive_url: '/badges/social_badge.svg',
    },
    {
      id: 3,
      name: 'Nature Novice',
      description: 'Completed a nature challenge',
      active_url: '/badges/nature_badge.svg',
      inactive_url: '/badges/nature_badge.svg',
    },
    {
      id: 4,
      name: 'Getting Moving',
      description: 'Completed a fitness challenge',
      active_url: '/badges/fitness_badge.svg',
      inactive_url: '/badges/fitness_badge.svg',
    },
    {
      id: 5,
      name: 'Flavour Seeker',
      description: 'Visited a restaurant or cafe.',
      active_url: '/badges/food_badge.svg',
      inactive_url: '/badges/food_badge.svg',
    },
    {
      id: 6,
      name: 'Local Legend',
      description: 'Completed 10 challenges of any category.',
      active_url: '/badges/legendary_award.svg',
      inactive_url: '/badges/legendary_award.svg',
    },
  ]

  for (const badge of badgeSeeds) {
    await prisma.badge.upsert({
      where: { id: badge.id },
      update: {
        name: badge.name,
        description: badge.description,
        active_url: badge.active_url,
        inactive_url: badge.inactive_url,
      },
      create: badge,
    })
  }

  await prisma.$executeRaw`
    SELECT setval(
      pg_get_serial_sequence('badge', 'id'),
      GREATEST((SELECT COALESCE(MAX(id), 1) FROM badge), 1),
      true
    )
  `

  const badgeCriteriaSeeds = [
    {
      badge_id: 1,
      stat_name: 'challenges_completed',
      category_id: 0,
      target_value: 3,
    },
    {
      badge_id: 2,
      stat_name: 'category_challenges_completed',
      category_id: socialCategory.id,
      target_value: 1,
    },
    {
      badge_id: 3,
      stat_name: 'category_challenges_completed',
      category_id: natureCategory.id,
      target_value: 1,
    },
    {
      badge_id: 4,
      stat_name: 'category_challenges_completed',
      category_id: fitnessCategory.id,
      target_value: 1,
    },
    {
      badge_id: 5,
      stat_name: 'category_challenges_completed',
      category_id: foodCategory.id,
      target_value: 1,
    },
    {
      badge_id: 6,
      stat_name: 'challenges_completed',
      category_id: 0,
      target_value: 10,
    },
  ]

  for (const criteria of badgeCriteriaSeeds) {
    await prisma.badge_criteria.upsert({
      where: {
        badge_id_category_id_stat_name: {
          badge_id: criteria.badge_id,
          category_id: criteria.category_id,
          stat_name: criteria.stat_name,
        },
      },
      update: {
        target_value: criteria.target_value,
      },
      create: criteria,
    })
  }

  // 3. Seed locations safely

  // Existing locations
  const park =
    (await prisma.location.findFirst({
      where: { name: 'Auckland Domain' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'Auckland Domain',
        category: 'park',
        latitude: -36.8485,
        longitude: 174.7633,
      },
    }))

  const cafe =
    (await prisma.location.findFirst({
      where: { name: 'Local Cafe' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'Local Cafe',
        category: 'restaurant',
        latitude: -36.85,
        longitude: 174.765,
      },
    }))

  const gym =
    (await prisma.location.findFirst({
      where: { name: 'City Gym' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'City Gym',
        category: 'fitness',
        latitude: -36.847,
        longitude: 174.76,
      },
    }))

  // --- NEW: Hobsonville area locations (within ~1km of your location) ---

  // Your approximate reference point:
  // Latitude: -36.7927
  // Longitude: 174.6560

  const hobsonvillePark =
    (await prisma.location.findFirst({
      where: { name: 'Hobsonville Point Park' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'Hobsonville Point Park',
        category: 'park',
        latitude: -36.7915,
        longitude: 174.6555,
      },
    }))

  const bombPoint =
    (await prisma.location.findFirst({
      where: { name: 'Bomb Point Reserve' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'Bomb Point Reserve',
        category: 'park',
        latitude: -36.7965,
        longitude: 174.6495,
      },
    }))

  const fabricCafe =
    (await prisma.location.findFirst({
      where: { name: 'Fabric Cafe Bistro' },
    })) ??
    (await prisma.location.create({
      data: {
        name: 'Fabric Cafe Bistro',
        category: 'restaurant',
        latitude: -36.7938,
        longitude: 174.6585,
      },
    }))

  // 4. Seed challenges safely
  const challengeSeeds = [
    // Existing challenges
    {
      name: 'Grab a coffee',
      description: 'Visit a local cafe and enjoy a coffee.',
      location_id: cafe.id,
      category_id: foodCategory.id,
      xp_worth: 10,
    },
    {
      name: 'Go for a walk',
      description: 'Take a 20-minute walk in the park.',
      location_id: park.id,
      category_id: fitnessCategory.id,
      xp_worth: 15,
    },
    {
      name: 'Talk to a stranger',
      description: 'Start a conversation with someone new.',
      location_id: park.id,
      category_id: socialCategory.id,
      xp_worth: 20,
    },
    {
      name: 'Workout session',
      description: 'Complete a gym workout.',
      location_id: gym.id,
      category_id: fitnessCategory.id,
      xp_worth: 25,
    },

    // --- NEW: Nearby challenges ---
    {
      name: 'Relax at Hobsonville Point Park',
      description: 'Spend some time outdoors and enjoy the waterfront park.',
      location_id: hobsonvillePark.id,
      category_id: fitnessCategory.id,
      xp_worth: 15,
    },
    {
      name: 'Explore Bomb Point',
      description: 'Walk through Bomb Point Reserve and explore the historic area.',
      location_id: bombPoint.id,
      category_id: socialCategory.id,
      xp_worth: 20,
    },
    {
      name: 'Coffee at Fabric',
      description: 'Grab a coffee or brunch at Fabric Cafe Bistro.',
      location_id: fabricCafe.id,
      category_id: foodCategory.id,
      xp_worth: 10,
    },
  ]

  for (const challenge of challengeSeeds) {
    const existing = await prisma.challenge.findFirst({
      where: { name: challenge.name },
    })

    if (!existing) {
      await prisma.challenge.create({ data: challenge })
    }
  }

  console.log('Seeding successful!')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
