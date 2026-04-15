import prisma from '../config/prisma';

export const createLocations = async ( data: any[] ) => {
    return prisma.location.createMany({
        data,
        skipDuplicates: true,
    });
}

