import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/daos/challengeDao', () => ({
  findAllActiveChallenges: vi.fn(),
  findActiveChallengeById: vi.fn(),
  findChallengeCategoriesByNames: vi.fn(),
  createChallenges: vi.fn(),
  completeUserChallenge: vi.fn(),
}))

vi.mock('../src/daos/locationDao', () => ({
  getLocationsWithoutChallenges: vi.fn(),
}))

vi.mock('../src/daos/profileDao', () => ({
  syncUserProfileByAuth: vi.fn(),
}))

import {
  createChallenges,
  completeUserChallenge,
  findActiveChallengeById,
  findAllActiveChallenges,
  findChallengeCategoriesByNames,
} from '../src/daos/challengeDao'
import { getLocationsWithoutChallenges } from '../src/daos/locationDao'
import { syncUserProfileByAuth } from '../src/daos/profileDao'
import {
  createNewChallenges,
  filterChallengesByRadius,
  getAllChallenges,
  getChallengeDetails,
  haversineDistance,
  checkInToChallenge,
} from '../src/services/challengeService'

describe('challengeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('calculates zero distance for identical coordinates', () => {
    expect(haversineDistance(-36.852, 174.765, -36.852, 174.765)).toBe(0)
  })

  it('filters challenges by distance and excludes missing locations', () => {
    const challenges = [
      { id: 1, location: { latitude: -36.852, longitude: 174.765 } },
      { id: 2, location: { latitude: -37.7826, longitude: 175.2528 } },
      { id: 3, location: null },
    ]

    expect(filterChallengesByRadius(challenges, -36.852, 174.765, 2)).toEqual([
      challenges[0],
    ])
  })

  it('returns all active challenges from the DAO', async () => {
    const challenges = [{ id: 1, name: 'Grab a bite' }]
    vi.mocked(findAllActiveChallenges).mockResolvedValue(challenges as any)

    await expect(getAllChallenges()).resolves.toBe(challenges)
  })

  it('returns challenge details for an active challenge', async () => {
    const challenge = { id: 5, name: 'Workout session' }
    vi.mocked(findActiveChallengeById).mockResolvedValue(challenge as any)

    await expect(getChallengeDetails(5)).resolves.toBe(challenge)
    expect(findActiveChallengeById).toHaveBeenCalledWith(5)
  })

  it('throws 404 when challenge details are not found', async () => {
    vi.mocked(findActiveChallengeById).mockResolvedValue(null)

    await expect(getChallengeDetails(99)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Challenge not found',
    })
  })

  it('syncs the auth profile before completing a challenge check-in', async () => {
    const completed = { id: 12, status: 'completed' }
    vi.mocked(syncUserProfileByAuth).mockResolvedValue({ id: 7 } as any)
    vi.mocked(completeUserChallenge).mockResolvedValue(completed as any)

    await expect(checkInToChallenge(4, 'auth-1', 'user@example.com')).resolves.toBe(
      completed
    )
    expect(syncUserProfileByAuth).toHaveBeenCalledWith({
      authId: 'auth-1',
      email: 'user@example.com',
    })
    expect(completeUserChallenge).toHaveBeenCalledWith(4, 7)
  })

  it('throws 404 when a challenge check-in cannot be completed', async () => {
    vi.mocked(syncUserProfileByAuth).mockResolvedValue({ id: 7 } as any)
    vi.mocked(completeUserChallenge).mockResolvedValue(null)

    await expect(checkInToChallenge(4, 'auth-1', 'user@example.com')).rejects.toMatchObject({
      statusCode: 404,
      message: 'Challenge not found',
    })
  })

  it('creates challenge records from unmapped locations', async () => {
    vi.mocked(getLocationsWithoutChallenges).mockResolvedValue([
      { id: 10, name: 'Cafe One', category: 'catering.cafe' },
      { id: 11, name: 'Fitness Place', category: 'sports.fitness_centre' },
      { id: 12, name: 'Community Hall', category: 'leisure.community_centre' },
    ] as any)
    vi.mocked(findChallengeCategoriesByNames).mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
      { id: 3, name: 'Social' },
    ] as any)
    vi.mocked(createChallenges).mockResolvedValue({ count: 3 } as any)

    await expect(createNewChallenges()).resolves.toEqual({ count: 3 })
    expect(createChallenges).toHaveBeenCalledWith([
      expect.objectContaining({
        name: 'Grab a bite',
        location_id: 10,
        category_id: 1,
        xp_worth: 10,
      }),
      expect.objectContaining({
        name: 'Workout session',
        location_id: 11,
        category_id: 2,
        xp_worth: 20,
      }),
      expect.objectContaining({
        name: 'Talk to a stranger',
        location_id: 12,
        category_id: 3,
        xp_worth: 15,
      }),
    ])
  })

  it('throws 409 when all locations already have challenges', async () => {
    vi.mocked(getLocationsWithoutChallenges).mockResolvedValue([])
    vi.mocked(findChallengeCategoriesByNames).mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
      { id: 3, name: 'Social' },
    ] as any)

    await expect(createNewChallenges()).rejects.toMatchObject({
      statusCode: 409,
      message: 'All locations have at least one challenge!',
    })
    expect(createChallenges).not.toHaveBeenCalled()
  })

  it('throws 500 when a required challenge category is missing', async () => {
    vi.mocked(getLocationsWithoutChallenges).mockResolvedValue([
      { id: 10, name: 'Cafe One', category: 'catering.cafe' },
    ] as any)
    vi.mocked(findChallengeCategoriesByNames).mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
    ] as any)

    await expect(createNewChallenges()).rejects.toMatchObject({
      statusCode: 500,
      message: "Challenge category 'Social' is missing",
    })
  })
})
