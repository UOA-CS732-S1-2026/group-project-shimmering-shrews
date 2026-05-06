import "dotenv/config";
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()
type ChallengeCategory = Awaited<ReturnType<typeof prisma.challenge_category.findMany>>[number]

async function main() {
  console.log('Seeding database.')

  // 1. Seed challenge categories safely
  await prisma.challenge_category.createMany({
    data: [
      { name: 'Food', icon: '🍔' },
      { name: 'Fitness', icon: '🏃' },
      { name: 'Social', icon: '👥' },
      { name: 'Nature', icon: '🌲' },
    ],
    skipDuplicates: true,
  })

  const categories = await prisma.challenge_category.findMany()
  const foodCategory = categories.find((c: ChallengeCategory) => c.name === 'Food')
  const fitnessCategory = categories.find((c: ChallengeCategory) => c.name === 'Fitness')
  const socialCategory = categories.find((c: ChallengeCategory) => c.name === 'Social')

  if (!foodCategory || !fitnessCategory || !socialCategory) {
    throw new Error('Failed to seed challenge categories')
  }

  // 2. Seed badges safely
  // NOTE: Adding badge criteria must be done manually
  await prisma.badge.createMany({
    data: [
      {
        name: 'Explorer',
        description: 'Completed 3 challenges.',
        active_url: '/badges/generic_award.svg',
        inactive_url: '/badges/generic_award.svg',
      },
      {
        name: 'Ice Breaker',
        description: 'Completed a social challenge.',
        active_url: '/badges/social_badge.svg',
        inactive_url: '/badges/social_badge.svg',
      },
      {
        name: 'Nature Novice',
        description: 'Completed a nature challenge.',
        active_url: '/badges/nature_badge.svg',
        inactive_url: '/badges/nature_badge.svg',
      },
      {
        name: 'Getting Moving',
        description: 'Completed a fitness challenge.',
        active_url: '/badges/fitness_badge.svg',
        inactive_url: '/badges/fitness_badge.svg',
      },
      {
        name: 'Flavour Seeker',
        description: 'Completed a food challenge.',
        active_url: '/badges/food_badge.svg',
        inactive_url: '/badges/food_badge.svg',
      },
      {
        name: 'Local Legend',
        description: 'Completed 10 challenges.',
        active_url: '/badges/legendary_award.svg',
        inactive_url: '/badges/legendary_award.svg',
      },
    ],
    skipDuplicates: true,
  })

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