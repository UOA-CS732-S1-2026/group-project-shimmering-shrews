import prisma from '../config/prisma'

export const userDAO = {
  async getUserByAuthId(authId: string) {
    return prisma.users.findUnique({
      where: { auth_id: authId },
      select: { id: true }
    })
  },

  // async getUserById(id: number) {
  //   return prisma.users.findUnique({
  //     where: {
  //       id: id,
  //     },
  //     select: {
  //       id: true,
  //       username: true,
  //       email: true,
  //       level: true,
  //       xp_earned: true,
  //       streak_count: true,
  //     },
  //   })
  // },
  async getProfileByAuthId(authId: string) {
    return prisma.users.findUnique({
      where: { auth_id: authId },
      select: {
        id: true,
        username: true,
        email: true,
        level: true,
        xp_earned: true,
        streak_count: true,
        awarded_badge: {
          select: {
            badge: {
              select: {
                id: true,
                name: true,
                description: true,
                active_url: true,
                inactive_url: true,
              },
            },
            earned_at: true,
          },
        },
      },
    })
  },
}