import prisma from "../config/prisma";

export const userChallengeDAO = {
  async getTodayUserChallengesByUserId(userId: number, today: Date) {
    return prisma.user_challenge.findMany({
      where: {
        user_id: userId,
        assigned_date: today,
      },
      include: {
        challenge: {
          include: {
            challenge_category: true,
            location: true,
          },
        },
      },
    });
  },

  async createTodayUserChallenges(
    userId: number,
    challenges: { id: number; xp_worth: number }[],
    today: Date
  ) {
    return prisma.user_challenge.createMany({
      data: challenges.map((challenge) => ({
        user_id: userId,
        challenge_id: challenge.id,
        assigned_date: today,
        status: "in_progress",
        xp_worth: challenge.xp_worth,
      })),
      skipDuplicates: true,
    });
  },
};