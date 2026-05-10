import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  challengeDaoMocks,
  userChallengeDaoMocks,
  userDaoMocks,
} from './helpers/daoMocks'
import {
  getUserChallenge,
  getUserChallenges,
  userChallengeService,
} from '../src/services/userChallengeService'

/**
 * Test category: Unit tests.
 *
 * These tests cover user challenge service behavior with DAOs mocked. They
 * verify daily assignment boundaries, acceptance/cancel/check-in orchestration,
 * distance/status guards, and service-level concurrency behavior. Real database
 * concurrency, constraints, and triggers are covered by opt-in integration tests.
 */
const { userChallengeDAO } = userChallengeDaoMocks

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
    vi.resetAllMocks()
    userDaoMocks.userDAO.getUserByAuthId.mockResolvedValue(user as any)
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('returns user challenges for an authenticated user', async () => {
    const challenges = [userChallenge()]
    userChallengeDaoMocks.findUserChallenges.mockResolvedValue(challenges as any)

    await expect(getUserChallenges(authId)).resolves.toBe(challenges)
    expect(userChallengeDaoMocks.findUserChallenges).toHaveBeenCalledWith(1)
  })

  it('throws 404 when listing challenges for an unknown user', async () => {
    userDaoMocks.userDAO.getUserByAuthId.mockResolvedValue(null)

    await expect(getUserChallenges(authId)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })

  it('returns one user challenge that belongs to the authenticated user', async () => {
    const challenge = userChallenge({ id: 44 })
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(challenge as any)

    await expect(getUserChallenge(authId, 44)).resolves.toBe(challenge)
    expect(userChallengeDaoMocks.findUserChallengeForUser).toHaveBeenCalledWith(44, 1)
  })

  it('throws 404 when the requested user challenge does not belong to the user', async () => {
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(null)

    await expect(getUserChallenge(authId, 44)).rejects.toMatchObject({
      statusCode: 404,
      message: 'User challenge not found',
    })
  })

  it('returns existing daily challenges without creating duplicates', async () => {
    const todayChallenges = [userChallenge({ id: 1 })]
    userChallengeDAO.getTodayUserChallengesByUserId.mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(todayChallenges)

    expect(userChallengeDAO.expireOpenChallengesBeforeDate).toHaveBeenCalledWith(
      1,
      expect.any(Date)
    )
    expect(challengeDaoMocks.findAllActiveChallenges).not.toHaveBeenCalled()
    expect(userChallengeDAO.createTodayUserChallenges).not.toHaveBeenCalled()
  })

  it('uses the Pacific/Auckland day boundary for today challenge lookup and expiry', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T23:30:00.000Z'))
    const todayChallenges = [userChallenge({ id: 1 })]
    userChallengeDAO.getTodayUserChallengesByUserId.mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(todayChallenges)

    const expiryCutoff = vi.mocked(userChallengeDAO.expireOpenChallengesBeforeDate)
      .mock.calls[0][1]
    const [, todayStart, tomorrowStart] = vi.mocked(
      userChallengeDAO.getTodayUserChallengesByUserId
    ).mock.calls[0]

    expect(expiryCutoff.toISOString()).toBe('2026-05-08T12:00:00.000Z')
    expect(todayStart.toISOString()).toBe('2026-05-08T12:00:00.000Z')
    expect(tomorrowStart.toISOString()).toBe('2026-05-09T12:00:00.000Z')
  })

  it('keeps the same challenge day across UTC midnight when the Auckland day has not changed', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-09T00:01:00.000Z'))
    const todayChallenges = [userChallenge({ id: 1 })]
    userChallengeDAO.getTodayUserChallengesByUserId.mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(todayChallenges)

    const expiryCutoff = vi.mocked(userChallengeDAO.expireOpenChallengesBeforeDate)
      .mock.calls[0][1]
    const [, todayStart, tomorrowStart] = vi.mocked(
      userChallengeDAO.getTodayUserChallengesByUserId
    ).mock.calls[0]

    expect(expiryCutoff.toISOString()).toBe('2026-05-08T12:00:00.000Z')
    expect(todayStart.toISOString()).toBe('2026-05-08T12:00:00.000Z')
    expect(tomorrowStart.toISOString()).toBe('2026-05-09T12:00:00.000Z')
  })

  it('keeps the previous challenge day until Auckland midnight', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T11:59:00.000Z'))
    const todayChallenges = [userChallenge({ id: 1 })]
    userChallengeDAO.getTodayUserChallengesByUserId.mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(authId, -36.852, 174.765, 5)
    ).resolves.toBe(todayChallenges)

    const expiryCutoff = vi.mocked(userChallengeDAO.expireOpenChallengesBeforeDate)
      .mock.calls[0][1]
    const [, todayStart, tomorrowStart] = vi.mocked(
      userChallengeDAO.getTodayUserChallengesByUserId
    ).mock.calls[0]

    expect(expiryCutoff.toISOString()).toBe('2026-05-07T12:00:00.000Z')
    expect(todayStart.toISOString()).toBe('2026-05-07T12:00:00.000Z')
    expect(tomorrowStart.toISOString()).toBe('2026-05-08T12:00:00.000Z')
  })

  it("uses the supplied user's timezone for today challenge lookup and expiry", async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-05-08T06:30:00.000Z'))
    const todayChallenges = [userChallenge({ id: 1 })]
    userChallengeDAO.getTodayUserChallengesByUserId.mockResolvedValue(
      todayChallenges as any
    )

    await expect(
      userChallengeService.getOrCreateTodayChallenges(
        authId,
        -36.852,
        174.765,
        5,
        'America/Los_Angeles'
      )
    ).resolves.toBe(todayChallenges)

    const expiryCutoff = vi.mocked(userChallengeDAO.expireOpenChallengesBeforeDate)
      .mock.calls[0][1]
    const [, todayStart, tomorrowStart] = vi.mocked(
      userChallengeDAO.getTodayUserChallengesByUserId
    ).mock.calls[0]

    expect(expiryCutoff.toISOString()).toBe('2026-05-07T07:00:00.000Z')
    expect(todayStart.toISOString()).toBe('2026-05-07T07:00:00.000Z')
    expect(tomorrowStart.toISOString()).toBe('2026-05-08T07:00:00.000Z')
  })

  it('creates at most three nearby daily challenges when none exist today', async () => {
    const createdChallenges = [userChallenge({ id: 1 }), userChallenge({ id: 2 })]
    userChallengeDAO.getTodayUserChallengesByUserId
      .mockResolvedValueOnce([])
      .mockResolvedValueOnce(createdChallenges as any)
    challengeDaoMocks.findAllActiveChallenges.mockResolvedValue([
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
    userChallengeDAO.acceptUserChallenge.mockResolvedValue(accepted as any)

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
    userChallengeDAO.acceptUserChallenge.mockResolvedValue(null)

    await expect(
      userChallengeService.acceptChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'User challenge not found',
    })
  })

  it('cancels a user challenge', async () => {
    const cancelled = userChallenge({ status: 'cancelled' })
    userChallengeDAO.cancelUserChallenge.mockResolvedValue(cancelled as any)

    await expect(userChallengeService.cancelChallenge(authId, 20)).resolves.toBe(
      cancelled
    )
  })

  it('returns an already completed challenge without completing it again', async () => {
    const completed = userChallenge({ status: 'completed' })
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(completed as any)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).resolves.toBe(completed)
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).not.toHaveBeenCalled()
  })

  it('requires a challenge to be accepted before check-in', async () => {
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(
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
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(userChallenge() as any)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -37.7826, 175.2528)
    ).rejects.toMatchObject({
      statusCode: 409,
    })
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).not.toHaveBeenCalled()
  })

  it('rejects check-in when the challenge location is missing', async () => {
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(
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
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(userChallenge() as any)
    challengeDaoMocks.completeUserChallengeByUserChallengeId.mockResolvedValue(completed as any)

    await expect(
      userChallengeService.checkInChallenge(
        authId,
        20,
        -36.852,
        174.765,
        'America/Los_Angeles'
      )
    ).resolves.toBe(completed)
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).toHaveBeenCalledWith(
      20,
      1,
      'America/Los_Angeles'
    )
  })

  it('handles concurrent challenge completions', async () => {
    const accepted = userChallenge()
    const completed = userChallenge({ status: 'completed' })
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(accepted as any)
    challengeDaoMocks.completeUserChallengeByUserChallengeId.mockResolvedValue(completed as any)

    await expect(
      Promise.all([
        userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765),
        userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765),
      ])
    ).resolves.toEqual([completed, completed])

    expect(userChallengeDaoMocks.findUserChallengeForUser).toHaveBeenCalledTimes(2)
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).toHaveBeenCalledTimes(2)
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).toHaveBeenNthCalledWith(
      1,
      20,
      1,
      undefined
    )
    expect(challengeDaoMocks.completeUserChallengeByUserChallengeId).toHaveBeenNthCalledWith(
      2,
      20,
      1,
      undefined
    )
  })

  it('throws 409 when the DAO cannot complete the challenge from its current status', async () => {
    userChallengeDaoMocks.findUserChallengeForUser.mockResolvedValue(userChallenge() as any)
    challengeDaoMocks.completeUserChallengeByUserChallengeId.mockResolvedValue(null)

    await expect(
      userChallengeService.checkInChallenge(authId, 20, -36.852, 174.765)
    ).rejects.toMatchObject({
      statusCode: 409,
      message: 'Challenge cannot be checked in from its current status',
    })
  })
})
