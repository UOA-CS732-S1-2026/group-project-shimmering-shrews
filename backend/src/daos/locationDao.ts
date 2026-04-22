import prisma from '../config/prisma';
import type { Prisma } from '@prisma/client'

export const createLocations = async (data: Prisma.locationCreateManyInput[]) => {
    return prisma.location.createMany({
        data,
        skipDuplicates: true,
    });
}

export const getLocationsWithoutChallenges = async () => {
    return prisma.location.findMany({
        where: {
            challenge: {
                none: {},
            }
        }
    })

}
