import prisma from "../config/prisma";
import { challenge_status } from "@prisma/client";

export const userChallengeDAO = {
  async getTodayUserChallengesByUserId(userId: number, startOfDay: Date, endOfDay: Date) {
    return prisma.user_challenge.findMany({
      where: {
        user_id: userId,
        assigned_at: {
          gte: startOfDay,
          lt: endOfDay,
        },
      },
      include: {
        challenge: {
            include: {
                challenge_category: true,
                location: true,
            }
        }
      },
    });
  },

  async createTodayUserChallenges(
    userId: number,
    challenges: { id: number; xp_worth: number }[]
  ) {
    return prisma.user_challenge.createMany({
      data: challenges.map((challenge) => ({
        user_id: userId,
        challenge_id: challenge.id,
        status: challenge_status.in_progress,
        xp_worth: challenge.xp_worth,
      })),
    });
  },
};