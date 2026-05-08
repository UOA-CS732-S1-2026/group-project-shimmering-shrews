import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/daos/badgeDAO', () => ({
  badgeDAO: {
    getBadgesForUser: vi.fn(),
  },
}))

vi.mock('../src/daos/userDao', () => ({
  userDAO: {
    getProfileByAuthId: vi.fn(),
  },
}))

import { userDAO } from '../src/daos/userDao'
import { UserService } from '../src/services/userService'

describe('UserService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('returns profile info with awarded badges mapped for the frontend', async () => {
    const earnedAt = new Date('2026-05-01T00:00:00.000Z')
    vi.mocked(userDAO.getProfileByAuthId).mockResolvedValue({
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
    vi.mocked(userDAO.getProfileByAuthId).mockResolvedValue({
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
    expect(userDAO.getProfileByAuthId).not.toHaveBeenCalled()
  })

  it('throws 404 when the profile does not exist', async () => {
    vi.mocked(userDAO.getProfileByAuthId).mockResolvedValue(null)

    await expect(UserService.getProfile('auth-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User not found',
    })
  })
})
