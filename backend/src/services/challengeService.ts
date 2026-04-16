import { findAllActiveChallenges, createChallenges } from '../daos/challengeDao'
import { getLocationsWithoutChallenges } from '../daos/locationDao'
import { mapLocations } from '../utils/mapLocations' 

export const getAllChallenges = async () => {
  return findAllActiveChallenges()
}

export const createNewChallenges = async () => {
  const locations = await getLocationsWithoutChallenges();
  
  if ( !locations.length ) {
    throw new Error( 'All locations have at least one challenge!' );
  }

  const data = []

  for ( let location of locations ) {
    data.push(mapLocations( location ));
  }
  
  return createChallenges( data );

}