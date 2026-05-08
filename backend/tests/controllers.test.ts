import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/services/challengeService', () => ({
  getAllChallenges: vi.fn(),
  getChallengeDetails: vi.fn(),
  checkInToChallenge: vi.fn(),
  createNewChallenges: vi.fn(),
}))

vi.mock('../src/services/userChallengeService', () => ({
  getUserChallenges: vi.fn(),
  getUserChallenge: vi.fn(),
  userChallengeService: {
    getOrCreateTodayChallenges: vi.fn(),
    acceptChallenge: vi.fn(),
    cancelChallenge: vi.fn(),
    checkInChallenge: vi.fn(),
  },
}))

vi.mock('../src/services/profileService', () => ({
  getUserProfile: vi.fn(),
}))

vi.mock('../src/daos/profileDao', () => ({
  syncUserProfileByAuth: vi.fn(),
}))

vi.mock('../src/services/userService', () => ({
  UserService: {
    getProfile: vi.fn(),
  },
}))

vi.mock('../src/services/locationService', () => ({
  fetchLocations: vi.fn(),
  addLocations: vi.fn(),
}))

import {
  checkInToChallenge,
  createNewChallenges,
  getAllChallenges,
  getChallengeDetails,
} from '../src/services/challengeService'
import {
  getUserChallenge,
  getUserChallenges,
  userChallengeService,
} from '../src/services/userChallengeService'
import { getUserProfile } from '../src/services/profileService'
import { syncUserProfileByAuth } from '../src/daos/profileDao'
import { UserService } from '../src/services/userService'
import { addLocations, fetchLocations } from '../src/services/locationService'
import * as challengeController from '../src/controllers/challengeController'
import * as userChallengeController from '../src/controllers/userChallengeController'
import * as profileController from '../src/controllers/profileController'
import * as authController from '../src/controllers/authController'
import * as userController from '../src/controllers/userController'
import * as locationController from '../src/controllers/locationController'
import type { NextFunction } from 'express'

type MockNext = ReturnType<typeof vi.fn> & NextFunction

const response = () => {
  const json = vi.fn()
  const status = vi.fn(() => ({ json }))

  return {
    res: { status } as any,
    status,
    json,
  }
}

const createNext = () => vi.fn() as unknown as MockNext

const nextError = (next: MockNext) => next.mock.calls[0]?.[0]

describe('challengeController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('wraps the active challenge list in a success envelope', async () => {
    const { res, status, json } = response()
    const challenges = [{ id: 1 }]
    vi.mocked(getAllChallenges).mockResolvedValue(challenges as any)

    await challengeController.getChallenges({} as any, res, createNext())

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: challenges })
  })

  it('rejects invalid challenge ids before loading details', async () => {
    const next = createNext()

    await challengeController.getChallenge(
      { params: { id: 'abc' } } as any,
      response().res,
      next
    )

    expect(nextError(next)).toMatchObject({
      statusCode: 400,
      message: 'Challenge id must be a positive integer',
    })
    expect(getChallengeDetails).not.toHaveBeenCalled()
  })

  it('checks in to a challenge with authenticated user data', async () => {
    const { res, status, json } = response()
    const completed = { id: 20, status: 'completed' }
    vi.mocked(checkInToChallenge).mockResolvedValue(completed as any)

    await challengeController.checkInChallenge(
      {
        params: { id: '5' },
        auth: { sub: 'auth-1', email: 'user@example.com' },
      } as any,
      res,
      createNext()
    )

    expect(checkInToChallenge).toHaveBeenCalledWith(5, 'auth-1', 'user@example.com')
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Challenge checked in',
      data: completed,
    })
  })

  it('requires an email before challenge check-in', async () => {
    const next = createNext()

    await challengeController.checkInChallenge(
      { params: { id: '5' }, auth: { sub: 'auth-1' } } as any,
      response().res,
      next
    )

    expect(nextError(next)).toMatchObject({
      statusCode: 401,
      message: 'Authenticated user email is missing',
    })
  })

  it('creates challenges from locations', async () => {
    const { res, status, json } = response()
    const result = { count: 3 }
    vi.mocked(createNewChallenges).mockResolvedValue(result as any)

    await challengeController.createChallengesFromLocations({} as any, res, createNext())

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Challenges created from new locations',
      data: result,
    })
  })
})

describe('userChallengeController', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('requires an authenticated user for listing assigned challenges', async () => {
    const next = createNext()

    await userChallengeController.getChallenges({ auth: undefined } as any, response().res, next)

    expect(nextError(next)).toMatchObject({
      statusCode: 401,
      message: 'Authenticated user is missing',
    })
  })

  it('lists assigned challenges for the authenticated user', async () => {
    const { res, status, json } = response()
    const challenges = [{ id: 1 }]
    vi.mocked(getUserChallenges).mockResolvedValue(challenges as any)

    await userChallengeController.getChallenges(
      { auth: { sub: 'auth-1' } } as any,
      res,
      createNext()
    )

    expect(getUserChallenges).toHaveBeenCalledWith('auth-1')
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: challenges })
  })

  it('rejects invalid user challenge ids', async () => {
    const next = createNext()

    await userChallengeController.getChallenge(
      { params: { id: '0' }, auth: { sub: 'auth-1' } } as any,
      response().res,
      next
    )

    expect(nextError(next)).toMatchObject({
      statusCode: 400,
      message: 'Challenge id must be a positive integer',
    })
    expect(getUserChallenge).not.toHaveBeenCalled()
  })

  it("uses a default radius for today's challenges", async () => {
    const { res, status, json } = response()
    const challenges = [{ id: 1 }]
    vi.mocked(userChallengeService.getOrCreateTodayChallenges).mockResolvedValue(
      challenges as any
    )

    await userChallengeController.getTodayUserChallenges(
      {
        auth: { sub: 'auth-1' },
        query: { lat: '-36.852', lng: '174.765' },
      } as any,
      res,
      createNext()
    )

    expect(userChallengeService.getOrCreateTodayChallenges).toHaveBeenCalledWith(
      'auth-1',
      -36.852,
      174.765,
      5
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: challenges })
  })

  it('requires lat and lng for today challenge generation', async () => {
    const next = createNext()

    await userChallengeController.getTodayUserChallenges(
      {
        auth: { sub: 'auth-1' },
        query: { lat: '-36.852' },
      } as any,
      response().res,
      next
    )

    expect(nextError(next)).toMatchObject({
      statusCode: 400,
      message: 'lat and lng query params are required',
    })
  })

  it('accepts a user challenge with parsed body coordinates', async () => {
    const { res, status, json } = response()
    const accepted = { id: 20, status: 'accepted' }
    vi.mocked(userChallengeService.acceptChallenge).mockResolvedValue(accepted as any)

    await userChallengeController.acceptUserChallenge(
      {
        auth: { sub: 'auth-1' },
        params: { id: '20' },
        body: { acceptedFromLat: '-36.852', acceptedFromLng: '174.765' },
      } as any,
      res,
      createNext()
    )

    expect(userChallengeService.acceptChallenge).toHaveBeenCalledWith(
      'auth-1',
      20,
      -36.852,
      174.765
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Challenge accepted',
      data: accepted,
    })
  })

  it('rejects invalid accept coordinates', async () => {
    const next = createNext()

    await userChallengeController.acceptUserChallenge(
      {
        auth: { sub: 'auth-1' },
        params: { id: '20' },
        body: { acceptedFromLat: 'NaN', acceptedFromLng: '174.765' },
      } as any,
      response().res,
      next
    )

    expect(nextError(next)).toMatchObject({
      statusCode: 400,
      message: 'acceptedFromLat must be a valid number',
    })
  })

  it('cancels a user challenge', async () => {
    const { res, status, json } = response()
    const cancelled = { id: 20, status: 'cancelled' }
    vi.mocked(userChallengeService.cancelChallenge).mockResolvedValue(cancelled as any)

    await userChallengeController.cancelUserChallenge(
      { auth: { sub: 'auth-1' }, params: { id: '20' } } as any,
      res,
      createNext()
    )

    expect(userChallengeService.cancelChallenge).toHaveBeenCalledWith('auth-1', 20)
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Challenge cancelled',
      data: cancelled,
    })
  })

  it('checks in a user challenge with parsed body coordinates', async () => {
    const { res, status, json } = response()
    const completed = { id: 20, status: 'completed' }
    vi.mocked(userChallengeService.checkInChallenge).mockResolvedValue(completed as any)

    await userChallengeController.checkInUserChallenge(
      {
        auth: { sub: 'auth-1' },
        params: { id: '20' },
        body: { completedFromLat: '-36.852', completedFromLng: '174.765' },
      } as any,
      res,
      createNext()
    )

    expect(userChallengeService.checkInChallenge).toHaveBeenCalledWith(
      'auth-1',
      20,
      -36.852,
      174.765
    )
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Challenge checked in',
      data: completed,
    })
  })
})

describe('profile, auth, user, and location controllers', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns the authenticated profile summary', async () => {
    const { res, status, json } = response()
    const profile = { name: 'City_Scout-01' }
    vi.mocked(getUserProfile).mockResolvedValue(profile as any)

    await profileController.getMyProfile(
      { auth: { sub: 'auth-1', email: 'user@example.com' } } as any,
      res,
      createNext()
    )

    expect(getUserProfile).toHaveBeenCalledWith('auth-1', 'user@example.com')
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: profile })
  })

  it('requires auth for the profile summary', async () => {
    const next = createNext()

    await profileController.getMyProfile({ auth: undefined } as any, response().res, next)

    expect(nextError(next)).toMatchObject({
      statusCode: 401,
      message: 'Authenticated user is missing',
    })
  })

  it('syncs the authenticated user profile', async () => {
    const { res, status, json } = response()
    const profile = { id: 1 }
    vi.mocked(syncUserProfileByAuth).mockResolvedValue(profile as any)

    await authController.syncUser(
      { auth: { sub: 'auth-1', email: 'user@example.com' } } as any,
      res,
      createNext()
    )

    expect(syncUserProfileByAuth).toHaveBeenCalledWith({
      authId: 'auth-1',
      email: 'user@example.com',
    })
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: profile })
  })

  it('requires email when syncing an authenticated user', async () => {
    const next = createNext()

    await authController.syncUser({ auth: { sub: 'auth-1' } } as any, response().res, next)

    expect(nextError(next)).toMatchObject({
      statusCode: 401,
      message: 'Authenticated user email is missing',
    })
  })

  it('returns current user profile info', async () => {
    const { res, status, json } = response()
    const profile = { id: 1, badges: [] }
    vi.mocked(UserService.getProfile).mockResolvedValue(profile as any)

    await userController.getProfileInfo(
      { auth: { sub: 'auth-1' } } as any,
      res,
      createNext()
    )

    expect(UserService.getProfile).toHaveBeenCalledWith('auth-1')
    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({ success: true, data: profile })
  })

  it('fetches locations', async () => {
    const { res, status, json } = response()
    const locations = [{ id: 1 }]
    vi.mocked(fetchLocations).mockResolvedValue(locations as any)

    await locationController.fetchPlaces({} as any, res, createNext())

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Locations fetched',
      data: locations,
    })
  })

  it('fetches and creates locations', async () => {
    const { res, status, json } = response()
    const result = { count: 1 }
    vi.mocked(addLocations).mockResolvedValue(result as any)

    await locationController.fetchAndCreateLocations({} as any, res, createNext())

    expect(status).toHaveBeenCalledWith(200)
    expect(json).toHaveBeenCalledWith({
      success: true,
      message: 'Locations added to database',
      data: result,
    })
  })
})
