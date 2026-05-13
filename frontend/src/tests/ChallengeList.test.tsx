import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChallengeList from '../pages/ChallengeList'
import { getUserChallenges } from '../services/userChallenges'
import type { UserChallenge } from '../types/userChallenge'

vi.mock('../services/userChallenges', () => ({
  getUserChallenges: vi.fn(),
}))

vi.mock('../hooks/useLocationPermission', () => ({
  useLocationPermission: () => ({
    permissionStatus: 'granted',
    requestPermission: vi.fn(),
    userLocation: [-36.8406, 174.7677],
  }),
}))

const mockGetUserChallenges = vi.mocked(getUserChallenges)

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

function makeUserChallenge(overrides: Partial<UserChallenge> = {}): UserChallenge {
  return {
    id: 42,
    user_id: 7,
    challenge_id: 12,
    status: 'in_progress',
    xp_worth: 50,
    assigned_at: new Date('2026-05-12T00:00:00.000Z'),
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
    ...overrides,
  }
}

function renderChallengeList(goToDetailView = vi.fn()) {
  const view = render(
    <MemoryRouter>
      <ChallengeList goToDetailView={goToDetailView} />
    </MemoryRouter>
  )

  return { ...view, goToDetailView }
}

describe('ChallengeList', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders challenge cards when mocked challenge data is returned', async () => {
    mockGetUserChallenges.mockResolvedValue([
      makeUserChallenge(),
      makeUserChallenge({
        id: 43,
        status: 'accepted',
        challenge: {
          ...makeUserChallenge().challenge,
          name: 'Try a new cafe',
          description: 'Find a cafe nearby.',
          xp_worth: 25,
          challenge_category: {
            id: 4,
            name: 'Food',
          },
        },
      }),
    ])

    renderChallengeList()

    expect(await screen.findByText('Try a new cafe')).toBeInTheDocument()
    expect(screen.getByText('Visit the waterfront')).toBeInTheDocument()
    expect(screen.getByText('Find a cafe nearby.')).toBeInTheDocument()
    expect(screen.getByText('25 XP')).toBeInTheDocument()
    expect(screen.getByText('Accepted')).toBeInTheDocument()
    expect(mockGetUserChallenges).toHaveBeenCalledWith(-36.8406, 174.7677, 5)
  })

  it('shows a loading state while fetching challenges', () => {
    const pendingChallenges = createDeferred<UserChallenge[]>()
    mockGetUserChallenges.mockReturnValue(pendingChallenges.promise)

    const { container } = renderChallengeList()

    expect(screen.getByRole('heading', { name: /today's challenges/i })).toBeInTheDocument()
    expect(container.querySelectorAll('.skeleton')).not.toHaveLength(0)
    expect(screen.queryByText('Visit the waterfront')).not.toBeInTheDocument()

    pendingChallenges.resolve([])
  })

  it('shows an error message when the service call fails', async () => {
    mockGetUserChallenges.mockRejectedValue(new Error('Service unavailable'))

    renderChallengeList()

    expect(await screen.findByText('Could not load challenges.')).toBeInTheDocument()
  })

  it('handles an empty challenge list without crashing', async () => {
    mockGetUserChallenges.mockResolvedValue([])

    const { container } = renderChallengeList()

    await waitFor(() => {
      expect(mockGetUserChallenges).toHaveBeenCalled()
    })

    const list = container.querySelector('.challenge-list-container')
    // one child will be displayed: the no challenges found message
    expect(list?.children).toHaveLength(1)
    expect(screen.getByRole('heading', { name: /today's challenges/i })).toBeInTheDocument()
  })

  it('selects a challenge with the expected detail callback', async () => {
    const userChallenge = makeUserChallenge()
    const goToDetailView = vi.fn()
    mockGetUserChallenges.mockResolvedValue([userChallenge])

    renderChallengeList(goToDetailView)
    fireEvent.click(await screen.findByText('Visit the waterfront'))

    expect(goToDetailView).toHaveBeenCalledWith(userChallenge)
  })
})

// Frontend tests use mocked service responses only; real backend/database access belongs in backend or integration tests.
