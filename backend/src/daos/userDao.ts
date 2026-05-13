import prisma from '../config/prisma'

export const userDAO = {
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
    const rank = await prisma.users.count({
      where: { xp_earned: { gt: currentUser.xp_earned } },
    })
    currentUserRank = { ...currentUser, rank: rank + 1 }
  }

  return { topUsers, currentUserRank }
  }
}