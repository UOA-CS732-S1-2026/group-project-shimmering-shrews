import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/daos/profileDao', () => ({
  countCompletedChallengesByUserId: vi.fn(),
  findBadgesByUserId: vi.fn(),
  findRecentCompletedChallengesByUserId: vi.fn(),
  findUserProfileByAuthId: vi.fn(),
  upsertUserProfileByAuth: vi.fn(),
}))

import {
  countCompletedChallengesByUserId,
  findBadgesByUserId,
  findRecentCompletedChallengesByUserId,
  findUserProfileByAuthId,
  upsertUserProfileByAuth,
} from '../src/daos/profileDao'
import { getUserProfile } from '../src/services/profileService'

const profile = {
  id: 1,
  username: 'City_Scout-01',
  level: 2,
  xp_earned: 40,
  streak_count: 3,
}

const setupProfileDependencies = () => {
  vi.mocked(countCompletedChallengesByUserId).mockResolvedValue(2)
  vi.mocked(findBadgesByUserId).mockResolvedValue([
    {
      id: 1,
      name: 'Explorer',
      description: null,
      active_url: null,
      inactive_url: null,
      awarded_badge: [{ user_id: 1 }],
    },
    {
      id: 2,
      name: 'Ice Breaker',
      description: 'Complete a social challenge',
      active_url: '/badges/social_badge.svg',
      inactive_url: '/badges/social_inactive.svg',
      awarded_badge: [],
    },
  ] as any)
  vi.mocked(findRecentCompletedChallengesByUserId).mockResolvedValue([
    {
      challenge_id: 10,
      xp_worth: 15,
      completed_at: new Date('2026-05-01T00:00:00.000Z'),
      challenge: {
        name: 'Talk to a stranger',
        description: 'Meet someone new',
      },
    },
    {
      challenge_id: 11,
      xp_worth: 10,
      completed_at: null,
      challenge: {
        name: 'Grab a bite',
        description: null,
      },
    },
  ] as any)
}

describe('profileService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    setupProfileDependencies()
  })

  it('builds the profile summary with badges, XP thresholds, and recent history', async () => {
    vi.mocked(findUserProfileByAuthId).mockResolvedValue(profile as any)

    await expect(getUserProfile('auth-1')).resolves.toMatchObject({
      name: 'City_Scout-01',
      level: 2,
      xp: 40,
      streak: 3,
      badges: 1,
      challengesCompleted: 2,
      xpForCurrentLevel: 30,
      xpForNextLevel: 75,
      badgeItems: [
        {
          id: 1,
          name: 'Explorer',
          description: 'Badge earned through your city adventures.',
          active_icon: '/profile-placeholder.svg',
          inactive_icon: '/profile-placeholder.svg',
          earned: true,
        },
        {
          id: 2,
          name: 'Ice Breaker',
          description: 'Complete a social challenge',
          active_icon: '/badges/social_badge.svg',
          inactive_icon: '/badges/social_inactive.svg',
          earned: false,
        },
      ],
      historyItems: [
        {
          id: 10,
          title: 'Talk to a stranger',
          detail: 'Meet someone new',
          xp: 15,
        },
        {
          id: 11,
          title: 'Grab a bite',
          detail: 'Challenge completed',
          xp: 10,
        },
      ],
    })
  })

  it('creates a profile from auth data when none exists', async () => {
    vi.mocked(findUserProfileByAuthId).mockResolvedValue(null)
    vi.mocked(upsertUserProfileByAuth).mockResolvedValue(profile as any)

    await expect(getUserProfile('auth-1', 'user@example.com')).resolves.toMatchObject({
      name: 'City_Scout-01',
    })
    expect(upsertUserProfileByAuth).toHaveBeenCalledWith('auth-1', 'user@example.com')
  })

  it('refreshes legacy usernames that do not match the generated username format', async () => {
    vi.mocked(findUserProfileByAuthId).mockResolvedValue({
      ...profile,
      username: 'testuser',
    } as any)
    vi.mocked(upsertUserProfileByAuth).mockResolvedValue(profile as any)

    await getUserProfile('auth-1', 'user@example.com')

    expect(upsertUserProfileByAuth).toHaveBeenCalledWith('auth-1', 'user@example.com')
  })

  it('throws 404 when a missing profile cannot be created from auth email', async () => {
    vi.mocked(findUserProfileByAuthId).mockResolvedValue(null)

    await expect(getUserProfile('auth-1')).rejects.toMatchObject({
      statusCode: 404,
      message: 'User profile not found',
    })
  })
})
