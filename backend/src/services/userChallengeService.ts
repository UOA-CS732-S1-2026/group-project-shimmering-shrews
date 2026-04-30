import { userDAO } from '../daos/userDao'
import { userChallengeDAO } from '../daos/userChallengeDao'
import { findAllActiveChallenges } from '../daos/challengeDao'

export const userChallengeService = {
  async getOrCreateTodayChallenges(authId: string) {
    const user = await userDAO.getUserByAuthId(authId);

    if (!user) {
      throw new Error("User not found");
    }

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    let userChallenges =
      await userChallengeDAO.getTodayUserChallengesByUserId(
        user.id,
        today 
        
    );

    if (userChallenges.length === 0) {
    const challenges = await findAllActiveChallenges();

    await userChallengeDAO.createTodayUserChallenges(user.id, challenges, today);

    userChallenges =
        await userChallengeDAO.getTodayUserChallengesByUserId(
        user.id,
        today
        );
    }
    return userChallenges.map((uc) => uc.challenge);
  },
};