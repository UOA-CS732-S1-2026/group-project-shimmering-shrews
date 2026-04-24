import prisma from '../config/prisma'

export const badgeDAO = {
  async getBadgesForUser(userId: number) {
    return prisma.awarded_badge.findMany({
      where: {
        user_id: userId,
      },
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
    })
  },
}