import { beforeEach, describe, expect, it, vi } from 'vitest'
import { userDaoMocks } from './helpers/daoMocks'
import { UserService } from '../src/services/userService'

/**
 * Test category: Unit tests.
 *
 * These tests cover user profile service mapping and authorization decisions
 * with the user DAO mocked. They document badge response mapping and forbidden/
 * not-found behavior without requiring database rows.
 */
describe('UserService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('returns profile info with awarded badges mapped for the frontend', async () => {
    const earnedAt = new Date('2026-05-01T00:00:00.000Z')
    userDaoMocks.userDAO.getProfileByAuthId.mockResolvedValue({
      id: 1,
      username: 'City_Scout-01',
      email: 'user@example.com',
      level: 2,
      xp_earned: 40,
      streak_count: 3,
      awarded_badge: [
        {
          earned_at: earnedAt,
          badge: {
            id: 4,
            name: 'Getting Moving',
            description: 'Completed a fitness challenge',
            active_url: '/badges/fitness_badge.svg',
            inactive_url: '/badges/fitness_badge_inactive.svg',
          },
        },
      ],
    } as any)

    await expect(UserService.getProfile('auth-1')).resolves.toMatchObject({
      username: 'City_Scout-01',
      badges: [
        {
          id: 4,
          name: 'Getting Moving',
          description: 'Completed a fitness challenge',
          active_icon: '/badges/fitness_badge.svg',
          inactive_icon: '/badges/fitness_badge_inactive.svg',
          earnedAt,
          earned: true,
        },
      ],
    })
  })

  it('uses the active icon as a fallback when inactive icon is absent', async () => {
    userDaoMocks.userDAO.getProfileByAuthId.mockResolvedValue({
      id: 1,
      username: 'City_Scout-01',
      email: 'user@example.com',
      level: 2,
      xp_earned: 40,
      streak_count: 3,
      awarded_badge: [
        {
          earned_at: new Date('2026-05-01T00:00:00.000Z'),
          badge: {
            id: 1,
            name: 'Explorer',
            description: 'Completed 3 challenges',
            active_url: '/badges/generic_award.svg',
            inactive_url: null,
          },
        },
      ],
    } as any)

    const result = await UserService.getProfile('auth-1')

    expect(result.badges[0].inactive_icon).toBe('/badges/generic_award.svg')
  })

  it('forbids fetching another user profile', async () => {
    await expect(UserService.getProfile('auth-1', 'auth-2')).rejects.toMatchObject({
      statusCode: 403,
      message: 'Forbidden',
    })
    expect(userDaoMocks.userDAO.getProfileByAuthId).not.toHaveBeenCalled()
  })

  it('throws 404 when the profile does not exist', async () => {
    userDaoMocks.userDAO.getProfileByAuthId.mockResolvedValue(null)

    await expect(UserService.getProfile('auth-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })
})
