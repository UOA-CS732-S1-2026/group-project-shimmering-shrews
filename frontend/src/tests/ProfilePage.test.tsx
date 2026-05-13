import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ProfilePage from '../pages/ProfilePage'
import { getLeaderboard, getMyProfile } from '../services/profile'
import type { Leaderboard, LiveProfile } from '../services/profile'

vi.mock('../services/profile', () => ({
  getLeaderboard: vi.fn(),
  getMyProfile: vi.fn(),
}))

type MockAuthState = {
  loading: boolean
  logout: ReturnType<typeof vi.fn>
  session: { access_token: string } | null
  user: { user_metadata: { avatar_url: string } } | null
}

let mockAuthState: MockAuthState = {
  loading: false,
  logout: vi.fn(),
  session: { access_token: 'mock-token' },
  user: {
    user_metadata: {
      avatar_url: '/avatar.png',
    },
  },
}

vi.mock('../context/useAuth', () => ({
  useAuth: () => mockAuthState,
}))

vi.mock('../hooks/useLogout', () => ({
  useLogout: () => vi.fn(),
}))

const mockGetMyProfile = vi.mocked(getMyProfile)
const mockGetLeaderboard = vi.mocked(getLeaderboard)

type Deferred<T> = {
  promise: Promise<T>
  reject: (reason?: unknown) => void
  resolve: (value: T) => void
}

function createDeferred<T>(): Deferred<T> {
  let resolve: Deferred<T>['resolve']
  let reject: Deferred<T>['reject']
  const promise = new Promise<T>((promiseResolve, promiseReject) => {
    resolve = promiseResolve
    reject = promiseReject
  })

  return { promise, resolve: resolve!, reject: reject! }
}

function makeProfile(overrides: Partial<LiveProfile> = {}): LiveProfile {
  return {
    badgeItems: [
      {
        id: 1,
        active_icon: '/active.svg',
        inactive_icon: '/inactive.svg',
        description: 'Completed your first city quest.',
        earned: true,
        name: 'First Quest',
      },
    ],
    badges: 1,
    challengesCompleted: 3,
    historyItems: [
      {
        id: 10,
        detail: 'Checked in at the waterfront.',
        title: 'Waterfront Walk',
        xp: 50,
      },
    ],
    level: 2,
    name: 'Vivienne',
    streak: 4,
    xp: 150,
    xpForCurrentLevel: 100,
    xpForNextLevel: 250,
    ...overrides,
  }
}

function makeLeaderboard(overrides: Partial<Leaderboard> = {}): Leaderboard {
  return {
    topUsers: [
      {
        rank: 1,
        username: 'Avery',
        xp_earned: 900,
        level: 5,
      },
      {
        rank: 2,
        username: 'Morgan',
        xp_earned: 720,
        level: 4,
      },
    ],
    currentUserRank: {
      rank: 8,
      username: 'Vivienne',
      xp_earned: 151,
      level: 2,
    },
    ...overrides,
  }
}

function renderProfilePage() {
  render(
    <MemoryRouter>
      <ProfilePage />
    </MemoryRouter>
  )
}

describe('ProfilePage', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockAuthState = {
      loading: false,
      logout: vi.fn(),
      session: { access_token: 'mock-token' },
      user: {
        user_metadata: {
          avatar_url: '/avatar.png',
        },
      },
    }
  })

  it('renders mocked user profile data', async () => {
    mockGetMyProfile.mockResolvedValue(makeProfile())

    renderProfilePage()

    expect(await screen.findByRole('heading', { name: 'Vivienne' })).toBeInTheDocument()
    expect(screen.getAllByText('Level 2')).toHaveLength(2)
    expect(screen.getByText('First Quest')).toBeInTheDocument()
    expect(screen.getByText('3')).toBeInTheDocument()
    expect(mockGetMyProfile).toHaveBeenCalledTimes(1)
  })

  it('shows loading state while profile data is pending', () => {
    const pendingProfile = createDeferred<LiveProfile>()
    mockGetMyProfile.mockReturnValue(pendingProfile.promise)

    renderProfilePage()

    expect(screen.getByText('Loading...')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Loading badges...' })).toBeInTheDocument()

    pendingProfile.resolve(makeProfile())
  })

  it('shows an error state when the profile service fails', async () => {
    mockGetMyProfile.mockRejectedValue(new Error('Profile unavailable'))

    renderProfilePage()

    expect(await screen.findByText('Profile unavailable')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith('Failed to load profile', expect.any(Error))
  })

  it('loads and renders leaderboard data when the leaderboard tab is selected', async () => {
    mockGetMyProfile.mockResolvedValue(makeProfile())
    mockGetLeaderboard.mockResolvedValue(makeLeaderboard())

    renderProfilePage()

    expect(await screen.findByRole('heading', { name: 'Vivienne' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))

    expect(await screen.findByRole('heading', { name: 'Leaderboard' })).toBeInTheDocument()
    expect(mockGetLeaderboard).toHaveBeenCalledTimes(1)
    expect(screen.getByText('Avery👑')).toBeInTheDocument()
    expect(screen.getByText('Level 5')).toBeInTheDocument()
    expect(screen.getByText('900 XP')).toBeInTheDocument()
    expect(screen.getByText('Morgan')).toBeInTheDocument()
    expect(screen.getByText('#8')).toBeInTheDocument()
    expect(screen.getByText('Vivienne (You)')).toBeInTheDocument()
    expect(screen.getByText('151 XP')).toBeInTheDocument()
  })

  it('shows a leaderboard error message when leaderboard loading fails', async () => {
    mockGetMyProfile.mockResolvedValue(makeProfile())
    mockGetLeaderboard.mockRejectedValue(new Error('Leaderboard unavailable'))

    renderProfilePage()

    expect(await screen.findByRole('heading', { name: 'Vivienne' })).toBeInTheDocument()
    fireEvent.click(screen.getByRole('tab', { name: 'Leaderboard' }))

    expect(await screen.findByText('Could not load leaderboard.')).toBeInTheDocument()
    expect(mockGetLeaderboard).toHaveBeenCalledTimes(1)
  })

  it('shows a signed-out fallback when no user is available', async () => {
    mockAuthState = {
      loading: false,
      logout: vi.fn(),
      session: null,
      user: null,
    }

    renderProfilePage()

    expect(screen.getByText('Please sign in to view your profile.')).toBeInTheDocument()
    await waitFor(() => {
      expect(mockGetMyProfile).not.toHaveBeenCalled()
    })
  })
})

// Profile tests use mocked auth and profile services only; real backend/database data belongs in integration tests.
