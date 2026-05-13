import prisma from '../config/prisma';
import type { Prisma } from '@prisma/client'

// Inserts multiple locations into the database, skipping any duplicates.
export const createLocations = async (data: Prisma.locationCreateManyInput[]) => {
  return prisma.location.createMany({
    data,
    skipDuplicates: true,
  });
}

// Returns all locations that do not yet have any challenges associated with them.
// Used to find locations eligible for new challenge creation.
export const getLocationsWithoutChallenges = async () => {
  return prisma.location.findMany({
    where: {
      challenge: {
        none: {},
      },
    },
  });
}
