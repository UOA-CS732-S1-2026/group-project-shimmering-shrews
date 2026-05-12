import { beforeEach, describe, expect, it, vi } from 'vitest'
import { challengeDaoMocks, locationDaoMocks, profileDaoMocks } from './helpers/daoMocks'
import {
  createNewChallenges,
  filterChallengesByRadius,
  getAllChallenges,
  getChallengeDetails,
  haversineDistance,
} from '../src/services/challengeService'

/**
 * Test category: Unit tests.
 *
 * These tests exercise challenge service behavior with all DAO/profile/location
 * dependencies mocked. They verify branching, validation, mapping, and service
 * orchestration without opening database connections or making network calls.
 */
describe('challengeService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
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
    challengeDaoMocks.findAllActiveChallenges.mockResolvedValue(challenges as any)

    await expect(getAllChallenges()).resolves.toBe(challenges)
  })

  it('returns challenge details for an active challenge', async () => {
    const challenge = { id: 5, name: 'Workout session' }
    challengeDaoMocks.findActiveChallengeById.mockResolvedValue(challenge as any)

    await expect(getChallengeDetails(5)).resolves.toBe(challenge)
    expect(challengeDaoMocks.findActiveChallengeById).toHaveBeenCalledWith(5)
  })

  it('throws 404 when challenge details are not found', async () => {
    challengeDaoMocks.findActiveChallengeById.mockResolvedValue(null)

    await expect(getChallengeDetails(99)).rejects.toMatchObject({
      statusCode: 404,
      message: 'Challenge not found',
    })
  })



  it('creates challenge records from unmapped locations', async () => {
    locationDaoMocks.getLocationsWithoutChallenges.mockResolvedValue([
      { id: 10, name: 'Cafe One', category: 'catering.cafe' },
      { id: 11, name: 'Fitness Place', category: 'sports.fitness_centre' },
      { id: 12, name: 'Community Hall', category: 'leisure.community_centre' },
    ] as any)
    challengeDaoMocks.findChallengeCategoriesByNames.mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
      { id: 3, name: 'Social' },
    ] as any)
    challengeDaoMocks.createChallenges.mockResolvedValue({ count: 3 } as any)

    await expect(createNewChallenges()).resolves.toEqual({ count: 3 })
    expect(challengeDaoMocks.createChallenges).toHaveBeenCalledWith([
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
    locationDaoMocks.getLocationsWithoutChallenges.mockResolvedValue([])
    challengeDaoMocks.findChallengeCategoriesByNames.mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
      { id: 3, name: 'Social' },
    ] as any)

    await expect(createNewChallenges()).rejects.toMatchObject({
      statusCode: 409,
      message: 'All locations have at least one challenge!',
    })
    expect(challengeDaoMocks.createChallenges).not.toHaveBeenCalled()
  })

  it('throws 500 when a required challenge category is missing', async () => {
    locationDaoMocks.getLocationsWithoutChallenges.mockResolvedValue([
      { id: 10, name: 'Cafe One', category: 'catering.cafe' },
    ] as any)
    challengeDaoMocks.findChallengeCategoriesByNames.mockResolvedValue([
      { id: 1, name: 'Food' },
      { id: 2, name: 'Fitness' },
    ] as any)

    await expect(createNewChallenges()).rejects.toMatchObject({
      statusCode: 500,
      message: "Challenge category 'Social' is missing",
    })
  })
})
