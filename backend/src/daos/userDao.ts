import prisma from '../config/prisma'

export const userDAO = {
  // Returns a user's ID, level, and XP by their Supabase auth ID.
  async getUserByAuthId(authId: string) {
    return prisma.users.findUnique({
      where: { auth_id: authId },
      select: { 
        id: true,
        level: true,
        xp_earned: true,
      }
    })
  },

  // Returns a user's full profile including awarded badges, looked up by Supabase auth ID.
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

  // Updates a user's XP and level after completing a challenge.
  async updateXpAndLevel(userId: number, xpEarned: number, level: number) {
    return prisma.users.update({
      where: { id: userId },
      data: {
        xp_earned: xpEarned,
        level,
        updated_at: new Date(),
      },
      select: {
        id: true,
        level: true,
        xp_earned: true,
      },

    })
  },
  
  // Returns the top 10 users ranked by XP earned.
  // If the current user is not in the top 10, also returns their rank separately.
  async getLeaderboard(currentUserAuthId: string) {
    const topUsers = await prisma.users.findMany({
      take: 10,
      orderBy: { xp_earned: 'desc' },
      select: {
        id: true,
        username: true,
        xp_earned: true,
        level: true,
        auth_id: true,
      },
    })

    const currentUser = await prisma.users.findUnique({
      where: { auth_id: currentUserAuthId },
      select: {
        id: true,
        username: true,
        xp_earned: true,
        level: true,
        auth_id: true,
      },
    })

    if (!currentUser) return { topUsers, currentUserRank: null }

    const currentUserInTop10 = topUsers.some((u: { auth_id: string }) => u.auth_id === currentUserAuthId)

    let currentUserRank = null
    if (!currentUserInTop10) {
      // Count users with more XP to determine rank position
      const rank = await prisma.users.count({
        where: { xp_earned: { gt: currentUser.xp_earned } },
      })
      currentUserRank = { ...currentUser, rank: rank + 1 }
    }

    return { topUsers, currentUserRank }
  }
}