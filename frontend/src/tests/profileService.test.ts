import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseClient } from '../lib/supabase'
import { getLeaderboard, getMyProfile } from '../services/profile'

vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

vi.mock('../services/timeZone', () => ({
  getTimeZoneHeaders: () => ({ 'X-Time-Zone': 'Pacific/Auckland' }),
}))

const mockGetSupabaseClient = vi.mocked(getSupabaseClient)
const fetchMock = vi.fn()

const profile = {
  badgeItems: [],
  badges: 1,
  challengesCompleted: 3,
  historyItems: [],
  level: 2,
  name: 'Vivienne',
  streak: 4,
  xp: 150,
  xpForCurrentLevel: 100,
  xpForNextLevel: 250,
}

const leaderboard = {
  topUsers: [
    {
      rank: 1,
      username: 'Avery',
      xp_earned: 900,
      level: 5,
    },
  ],
  currentUserRank: {
    rank: 8,
    username: 'Vivienne',
    xp_earned: 151,
    level: 2,
  },
}

const okJson = <T,>(data: T) =>
  new Response(JSON.stringify({ success: true, data }), {
    headers: { 'Content-Type': 'application/json' },
    status: 200,
  })

const errorJson = (message: string, status = 400) =>
  new Response(JSON.stringify({ success: false, message }), {
    headers: { 'Content-Type': 'application/json' },
    status,
  })

const mockSession = (token: string | null = 'test-token') => {
  mockGetSupabaseClient.mockReturnValue({
    auth: {
      getSession: vi.fn().mockResolvedValue({
        data: {
          session: token ? { access_token: token } : null,
        },
      }),
    },
  } as unknown as ReturnType<typeof getSupabaseClient>)
}

describe('profile service API contract', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://api.test')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    mockSession()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('fetches the live profile with auth and timezone headers', async () => {
    fetchMock.mockResolvedValueOnce(okJson(profile))

    await expect(getMyProfile()).resolves.toEqual(profile)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/profile/me', {
      headers: {
        Authorization: 'Bearer test-token',
        'X-Time-Zone': 'Pacific/Auckland',
      },
    })
  })

  it('surfaces backend profile errors', async () => {
    fetchMock.mockResolvedValueOnce(errorJson('Profile unavailable', 503))

    await expect(getMyProfile()).rejects.toThrow('Profile unavailable')
  })

  it('fetches the leaderboard with the authenticated bearer token', async () => {
    fetchMock.mockResolvedValueOnce(okJson(leaderboard))

    await expect(getLeaderboard()).resolves.toEqual(leaderboard)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/api/user/leaderboard', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
  })

  it('rejects before fetching when there is no authenticated session', async () => {
    mockSession(null)

    await expect(getMyProfile()).rejects.toThrow('No authenticated session found')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
