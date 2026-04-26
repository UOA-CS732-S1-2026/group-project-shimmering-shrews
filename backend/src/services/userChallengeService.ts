import { userDAO } from '../daos/userDao'
import { userChallengeDAO } from '../daos/userChallengeDao'
import { findActiveChallengesByCategory, findAllActiveChallenges } from '../daos/challengeDao'

export const userChallengeService = {
  async getOrCreateTodayChallenges(authId: string) {
    const user = await userDAO.getUserByAuthId(authId);

    if (!user) {
      throw new Error("User not found");
    }

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    let userChallenges =
      await userChallengeDAO.getTodayUserChallengesByUserId(
        user.id, 
        startOfDay, 
        endOfDay
    );

    if (userChallenges.length === 0) {
    const challenges = await findAllActiveChallenges();

    await userChallengeDAO.createTodayUserChallenges(user.id, challenges);

    userChallenges =
        await userChallengeDAO.getTodayUserChallengesByUserId(
        user.id,
        startOfDay,
        endOfDay
        );
    }
    return userChallenges.map((uc) => uc.challenge);
  },
};