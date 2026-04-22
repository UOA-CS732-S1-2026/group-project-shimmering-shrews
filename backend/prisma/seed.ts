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

  // 2. Seed locations safely
  // Note: skipDuplicates only works if the table has a unique constraint.
  // Since your current schema does not enforce uniqueness on location name,
  // we use findFirst + create instead.

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

  // 3. Seed challenges safely
  // Schema  does not enforce uniqueness on challenge name,
  // so we use findFirst + create here too.

  const challengeSeeds = [
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
