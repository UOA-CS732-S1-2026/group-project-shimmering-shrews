import { findAllActiveChallenges } from '../daos/challengeDao'

export const getAllChallenges = async () => {
  return findAllActiveChallenges()
}