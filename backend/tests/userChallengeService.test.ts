import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/daos/challengeDao', () => ({
  completeUserChallengeByUserChallengeId: vi.fn(),
  findAllActiveChallenges: vi.fn(),
}))

vi.mock('../src/daos/userChallengeDao', () => ({
  findUserChallengeForUser: vi.fn(),
  findUserChallenges: vi.fn(),
  userChallengeDAO: {
    expireOpenChallengesBeforeDate: vi.fn(),
    getTodayUserChallengesByUserId: vi.fn(),
    createTodayUserChallenges: vi.fn(),
    acceptUserChallenge: vi.fn(),
    cancelUserChallenge: vi.fn(),
  },
}))

vi.mock('../src/daos/userDao', () => ({
  userDAO: {
    getUserByAuthId: vi.fn(),
  },
}))

import {
  completeUserChallengeByUserChallengeId,
  findAllActiveChallenges,
} from '../src/daos/challengeDao'
import {
  findUserChallengeForUser,
  findUserChallenges,
  userChallengeDAO,
} from '../src/daos/userChallengeDao'
import { userDAO } from '../src/daos/userDao'
import {
  getUserChallenge,
  getUserChallenges,
  userChallengeService,
} from '../src/services/userChallengeService'

const authId = 'auth-1'
const user = { id: 1 }

const activeChallenge = (id: number, latitude: number, longitude: number) => ({
  id,
  xp_worth: 10,
  location: {
    latitude,
    longitude,
  },
})

const userChallenge = (overrides: Record<string, unknown> = {}) => ({
  id: 20,
  user_id: 1,
  challenge_id: 30,
  status: 'accepted',
  xp_worth: 10,
  challenge: {
    id: 30,
    xp_worth: 10,
    is_active: true,
    location: {
      latitude: -36.852,
      longitude: 174.765,
    },
  },
  ...overrides,
})

describe('userChallengeService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    vi.mocked(userDAO.getUserByAuthId).mockResolvedValue(user as any)
  })

  it('returns user challenges for an authenticated user', async () => {
    const challenges = [userChallenge()]
    vi.mocked(findUserChallenges).mockResolvedValue(challenges as any)

    await expect(getUserChallenges(authId)).resolves.toBe(challenges)
    expect(findUserChallenges).toHaveBeenCalledWith(1)
  })

  it('throws 404 when listing challenges for an unknown user', async () => {
    vi.mocked(userDAO.getUserByAuthId).mockResolvedValue(null)

    await expect(getUserChallenges(authId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })

  it('returns one user challenge that belongs to the authenticated user', async () => {
    const challenge = userChallenge({ id: 44 })
    vi.mocked(findUserChallengeForUser).mockResolvedValue(challenge as any)

    await expect(getUserChallenge(authId, 44)).resolves.toBe(challenge)
    expect(findUserChallengeForUser).toHaveBeenCalledWith(44, 1)
  })

  it('throws 404 when the requested user challenge does not belong to the user', async () => {
    vi.mocked(findUserChallengeForUser).mockResolvedValue(null)

    await expect(getUserChallenge(authId, 44)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User challenge not found',
    })
  })

  it('returns existing daily challenges without creating duplicates', async () => {
    const todayChallenges = [userChallenge({ id: 1 })]
    vi.mocked(userChallengeDAO.getTodayUserChallengesByUserId).mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(todayChallenges)

    expect(userChallengeDAO.expireOpenChallengesBeforeDate).toHaveBeenCalledWith(
      1,
      expect.any(Date)
    )
    expect(findAllActiveChallenges).not.toHaveBeenCalled()
    expect(userChallengeDAO.createTodayUserChallenges).not.toHaveBeenCalled()
  })

  it('creates at most three nearby daily challenges when none exist today', async () => {
    const createdChallenges = [userChallenge({ id: 1 }), userChallenge({ id: 2 })]
    vi.mocked(userChallengeDAO.getTodayUserChallengesByUserId)
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(createdChallenges as any)
    vi.mocked(findAllActiveChallenges).mockResolvedValue([
      activeChallenge(1, -36.852, 174.765),
      activeChallenge(2, -36.853, 174.765),
      activeChallenge(3, -36.854, 174.765),
      activeChallenge(4, -36.855, 174.765),
      activeChallenge(5, -37.7826, 175.2528),
    ] as any)

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(createdChallenges)

    expect(userChallengeDAO.createTodayUserChallenges).toHaveBeenCalledWith(1, [
      expect.objectContaining({ id: 1 }),
      expect.objectContaining({ id: 2 }),
      expect.objectContaining({ id: 3 }),
    ])
  })

  it('accepts a user challenge with the supplied coordinates', async () => {
    const accepted = userChallenge({ status: 'accepted' })
    vi.mocked(userChallengeDAO.acceptUserChallenge).mockResolvedValue(accepted as any)

    await expect(
      userChallengeService.acceptChallenge(authId, 20, -36.852, 174.765)
    ).resolves.toBe(accepted)
    expect(userChallengeDAO.acceptUserChallenge).toHaveBeenCalledWith(
      20,
      1,
      -36.852,
      174.765
    )
  })

  it('throws 404 when accepting a missing user challenge', async () => {
    vi.mocked(userChallengeDAO.acceptUserChallenge).mockResolvedValue(null)

    await expect(
      userChallengeService.acceptChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'User challenge not found',
    })
  })

  it('cancels a user challenge', async () => {
    const cancelled = userChallenge({ status: 'cancelled' })
    vi.mocked(userChallengeDAO.cancelUserChallenge).mockResolvedValue(cancelled as any)

    await expect(userChallengeService.cancelChallenge(authId, 20)).resolves.toBe(
      cancelled
    )
  })

  it('returns an already completed challenge without completing it again', async () => {
    const completed = userChallenge({ status: 'completed' })
    vi.mocked(findUserChallengeForUser).mockResolvedValue(completed as any)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).resolves.toBe(completed)
    expect(completeUserChallengeByUserChallengeId).not.toHaveBeenCalled()
  })

  it('requires a challenge to be accepted before check-in', async () => {
    vi.mocked(findUserChallengeForUser).mockResolvedValue(
      userChallenge({ status: 'in_progress' }) as any
    )

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Challenge must be accepted before check in',
    })
  })

  it('requires the user to be within the configured completion radius', async () => {
    vi.mocked(findUserChallengeForUser).mockResolvedValue(userChallenge() as any)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -37.7826, 175.2528)
    ).rejects.toMatchObject({
      statusCode: 409,
    })
    expect(completeUserChallengeByUserChallengeId).not.toHaveBeenCalled()
  })

  it('rejects check-in when the challenge location is missing', async () => {
    vi.mocked(findUserChallengeForUser).mockResolvedValue(
      userChallenge({ challenge: { location: null } }) as any
    )

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'Challenge location is not set',
    })
  })

  it('completes an accepted user challenge from a nearby location', async () => {
    const completed = userChallenge({ status: 'completed' })
    vi.mocked(findUserChallengeForUser).mockResolvedValue(userChallenge() as any)
    vi.mocked(completeUserChallengeByUserChallengeId).mockResolvedValue(completed as any)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).resolves.toBe(completed)
    expect(completeUserChallengeByUserChallengeId).toHaveBeenCalledWith(20, 1)
  })

  it('throws 409 when the DAO cannot complete the challenge from its current status', async () => {
    vi.mocked(findUserChallengeForUser).mockResolvedValue(userChallenge() as any)
    vi.mocked(completeUserChallengeByUserChallengeId).mockResolvedValue(null)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Challenge cannot be checked in from its current status',
    })
  })
})
