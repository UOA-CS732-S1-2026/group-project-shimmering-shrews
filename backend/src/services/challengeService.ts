import { findAllActiveChallenges, findActiveChallengeById, findChallengeCategoriesByNames, createChallenges, completeUserChallenge } from '../daos/challengeDao'
import { getLocationsWithoutChallenges } from '../daos/locationDao'
import { ApiError } from '../utils/ApiError'
import { mapLocations } from '../utils/mapLocations' 
import { userDAO } from '../daos/userDao'

export const getAllChallenges = async () => {
  return findAllActiveChallenges()
}

export const getChallengeDetails = async (challengeId: number) => {
  const challenge = await findActiveChallengeById(challengeId)

  if (!challenge) {
    throw new ApiError(404, 'Challenge not found')
  }

  return challenge
}

export const checkInToChallenge = async (challengeId: number, authId: string) => {
  const user = await userDAO.getUserByAuthId(authId);
  const userId = user?.id;
  if (!userId){
    throw new ApiError(404, 'User not found')
  }
  const checkIn = await completeUserChallenge(challengeId, userId)

  if (!checkIn) {
    throw new ApiError(404, 'Challenge not found')
  }

  return checkIn
}

export const createNewChallenges = async () => {
  const locations = await getLocationsWithoutChallenges();
  const categories = await findChallengeCategoriesByNames(['Food', 'Fitness', 'Social'])
  const getCategoryId = (name: string) => {
    const category = categories.find((item) => item.name === name)

    if (!category) {
      throw new ApiError(500, `Challenge category '${name}' is missing`)
    }

    return category.id
  }
  const categoryIds = {
    food: getCategoryId('Food'),
    fitness: getCategoryId('Fitness'),
    social: getCategoryId('Social'),
  }
  
  // No locations without a challenge
  if ( !locations.length ) { 
    throw new ApiError(409, 'All locations have at least one challenge!');
  }

  const data = []

  for (const location of locations) {
    data.push(mapLocations(location, categoryIds));
  }
  
  return createChallenges( data );

}
