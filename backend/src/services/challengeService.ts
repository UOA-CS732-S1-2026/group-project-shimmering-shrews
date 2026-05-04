import { findAllActiveChallenges, findActiveChallengeById, findChallengeCategoriesByNames, createChallenges, completeUserChallenge } from '../daos/challengeDao'
import { getLocationsWithoutChallenges } from '../daos/locationDao'
import { syncUserProfileByAuth } from '../daos/profileDao'
import { ApiError } from '../utils/ApiError'
import { mapLocations } from '../utils/mapLocations'

export const DAILY_CHALLENGE_LIMIT = 3

const toRad = (deg: number) => (deg * Math.PI) / 180

export const haversineDistance = (
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number => {
  const R = 6371 // km
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const filterChallengesByRadius = <
  T extends { location: { latitude: { toNumber(): number } | number; longitude: { toNumber(): number } | number } | null }
>(
  challenges: T[],
  lat: number,
  lng: number,
  radiusKm: number
): T[] => {
  return challenges.filter((c) => {
    if (!c.location) return false
    const cLat = Number(c.location.latitude)
    const cLng = Number(c.location.longitude)
    return haversineDistance(lat, lng, cLat, cLng) <= radiusKm
  })
}

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

export const checkInToChallenge = async (challengeId: number, authId: string, email: string) => {
  const user = await syncUserProfileByAuth({
    authId,
    email,
  })
  const checkIn = await completeUserChallenge(challengeId, user.id)

  if (!checkIn) {
    throw new ApiError(404, 'Challenge not found')
  }

  return checkIn
}

export const createNewChallenges = async () => {
  const locations = await getLocationsWithoutChallenges()
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

  if (!locations.length) {
    throw new ApiError(409, 'All locations have at least one challenge!')
  }

  const data = []

  for (const location of locations) {
    data.push(mapLocations(location, categoryIds))
  }

  return createChallenges(data)
}
