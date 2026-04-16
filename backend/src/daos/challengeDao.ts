import prisma from '../config/prisma'

export const findAllActiveChallenges = async () => {
  return prisma.challenge.findMany({
    where: {
      is_active: true,
    },
    select: {
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
    },
  })
}

export const createChallenges = async ( data: any[] ) => {
    return prisma.challenge.createMany({
        data,
        skipDuplicates: true,
    });
}
