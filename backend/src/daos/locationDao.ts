import prisma from '../config/prisma';

export const createLocations = async ( data: any[] ) => {
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
