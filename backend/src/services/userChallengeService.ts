import { ApiError } from '../utils/ApiError';
import { userDAO } from '../daos/userDao';
import { findUserChallenge, findUserChallenges } from '../daos/userChallengeDao';


export const getUserChallenges = async ( authId: string ) => {
    const user = await userDAO.getUserByAuthId(authId);
    const userId = user?.id;
    if (!userId){
        throw new ApiError(404, 'User not found');
    }
    
    const userChallenges = await findUserChallenges( userId );

    if ( !userChallenges ) {
        throw new ApiError(404, 'User challenges not found')
    }

    return userChallenges;
}

export const getUserChallenge = async ( userChallengeId: number ) => {
  const userChallenge = await findUserChallenge( userChallengeId) ;

  if ( !userChallenge) {
    throw new ApiError(404, 'User challenge not found')
  }

  return userChallenge;
}

