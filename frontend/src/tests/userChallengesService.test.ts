import confetti from 'canvas-confetti'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { getSupabaseClient } from '../lib/supabase'
import {
  acceptUserChallenge,
  checkInUserChallenge,
  getUserChallenge,
  getUserChallenges,
} from '../services/userChallenges'
import type { UserChallenge } from '../types/userChallenge'

vi.mock('../lib/supabase', () => ({
  getSupabaseClient: vi.fn(),
}))

vi.mock('../services/timeZone', () => ({
  getTimeZoneHeaders: () => ({ 'X-Time-Zone': 'Pacific/Auckland' }),
}))

vi.mock('canvas-confetti', () => ({
  default: vi.fn(),
}))

const mockGetSupabaseClient = vi.mocked(getSupabaseClient)
const mockConfetti = vi.mocked(confetti)
const fetchMock = vi.fn()

const challenge = {
  id: 42,
  user_id: 8,
  challenge_id: 12,
  status: 'accepted',
  xp_worth: 50,
  assigned_at: '2026-05-13T04:18:07.374Z',
  accepted_at: '2026-05-13T04:25:12.587Z',
  accepted_from_lat: -36.8406,
  accepted_from_lng: 174.7677,
  completed_at: null,
  cancelled_at: null,
  expired_at: null,
  skipped_at: null,
  challenge: {
    id: 12,
    name: 'Visit the waterfront',
    description: 'Take a short walk by the water.',
    xp_worth: 50,
    challenge_category: {
      id: 3,
      name: 'Outdoor',
    },
    location: {
      id: 9,
      name: 'Auckland Waterfront',
      latitude: -36.8406,
      longitude: 174.7677,
    },
  },
} as unknown as UserChallenge

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

describe('userChallenges service API contract', () => {
  beforeEach(() => {
    vi.stubEnv('VITE_BACKEND_URL', 'http://api.test')
    vi.stubGlobal('fetch', fetchMock)
    fetchMock.mockReset()
    mockConfetti.mockReset()
    mockSession()
  })

  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  it('fetches today challenges with auth, timezone, coordinates, and radius', async () => {
    fetchMock.mockResolvedValueOnce(okJson([challenge]))

    await expect(getUserChallenges(-36.8406, 174.7677, 2)).resolves.toEqual([challenge])

    expect(fetchMock).toHaveBeenCalledWith(
      'http://api.test/user-challenges/today?lat=-36.8406&lng=174.7677&radius=2',
      {
        headers: {
          Authorization: 'Bearer test-token',
          'X-Time-Zone': 'Pacific/Auckland',
        },
      }
    )
  })

  it('fetches a single user challenge with the authenticated bearer token', async () => {
    fetchMock.mockResolvedValueOnce(okJson(challenge))

    await expect(getUserChallenge('42')).resolves.toEqual(challenge)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/user-challenges/42', {
      headers: {
        Authorization: 'Bearer test-token',
      },
    })
  })

  it('accepts a challenge with current coordinates in the request body', async () => {
    fetchMock.mockResolvedValueOnce(okJson({ ...challenge, status: 'accepted' }))

    await acceptUserChallenge(42, -36.8406, 174.7677)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/user-challenges/42/accept', {
      body: JSON.stringify({
        acceptedFromLat: -36.8406,
        acceptedFromLng: 174.7677,
      }),
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
      },
      method: 'PATCH',
    })
  })

  it('checks in a challenge with timezone headers and preserves nullable notifications', async () => {
    const response = {
      userChallenge: { ...challenge, status: 'completed' },
      notification: null,
    }
    fetchMock.mockResolvedValueOnce(okJson(response))

    await expect(checkInUserChallenge(42, -36.8406, 174.7677)).resolves.toEqual(response)

    expect(fetchMock).toHaveBeenCalledWith('http://api.test/user-challenges/42/checkin', {
      body: JSON.stringify({
        completedFromLat: -36.8406,
        completedFromLng: 174.7677,
      }),
      headers: {
        Authorization: 'Bearer test-token',
        'Content-Type': 'application/json',
        'X-Time-Zone': 'Pacific/Auckland',
      },
      method: 'POST',
    })
    expect(mockConfetti).toHaveBeenCalledWith({
      particleCount: 180,
      spread: 100,
      origin: { y: 0.6 },
    })
  })

  it('uses backend error messages when a request fails', async () => {
    fetchMock.mockResolvedValueOnce(errorJson('Challenge must be accepted before check in', 409))

    await expect(checkInUserChallenge(42, -36.8406, 174.7677)).rejects.toThrow(
      'Challenge must be accepted before check in'
    )
  })

  it('rejects before fetching when there is no authenticated session', async () => {
    mockSession(null)

    await expect(getUserChallenges(-36.8406, 174.7677, 2)).rejects.toThrow('User not authenticated')
    expect(fetchMock).not.toHaveBeenCalled()
  })
})
