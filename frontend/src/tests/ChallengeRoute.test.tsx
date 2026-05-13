import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChallengeRoute from '../pages/ChallengeRoute'
import { getUserChallenge } from '../services/userChallenges'
import type { UserChallenge } from '../types/userChallenge'

vi.mock('../services/userChallenges', () => ({
  getUserChallenge: vi.fn(),
}))

vi.mock('../pages/ChallengeDetailView', () => ({
  default: ({
    goToChallengeList,
    userChallenge,
  }: {
    goToChallengeList: () => void
    userChallenge: UserChallenge
  }) => (
    <div>
      <h1>Challenge Details</h1>
      <p>{userChallenge.challenge.name}</p>
      <button onClick={goToChallengeList}>Return to list</button>
    </div>
  ),
}))

const mockGetUserChallenge = vi.mocked(getUserChallenge)

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
    status: 'accepted',
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

function CurrentPath() {
  const location = useLocation()
  return <p>Current path: {location.pathname}</p>
}

function renderChallengeRoute(
  initialEntry: string | { pathname: string; state?: { userChallenge: UserChallenge } }
) {
  return render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <Routes>
        <Route path="/challenges" element={<CurrentPath />} />
        <Route path="/challenges/:userChallengeId" element={<ChallengeRoute />} />
        <Route path="/missing-param-test" element={<ChallengeRoute />} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ChallengeRoute', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders the detail child with route state when valid challenge data is provided', async () => {
    const userChallenge = makeUserChallenge()

    renderChallengeRoute({
      pathname: '/challenges/42',
      state: { userChallenge },
    })

    expect(await screen.findByText('Challenge Details')).toBeInTheDocument()
    expect(screen.getByText('Visit the waterfront')).toBeInTheDocument()
    expect(mockGetUserChallenge).not.toHaveBeenCalled()
  })

  it('fetches the challenge by route param and renders the detail child', async () => {
    mockGetUserChallenge.mockResolvedValue(makeUserChallenge())

    renderChallengeRoute('/challenges/42')

    expect(await screen.findByText('Visit the waterfront')).toBeInTheDocument()
    expect(mockGetUserChallenge).toHaveBeenCalledWith('42')
  })

  it('passes a callback that navigates back to the challenge list', async () => {
    mockGetUserChallenge.mockResolvedValue(makeUserChallenge())

    renderChallengeRoute('/challenges/42')
    fireEvent.click(await screen.findByRole('button', { name: /return to list/i }))

    expect(screen.getByText('Current path: /challenges')).toBeInTheDocument()
  })

  it('shows a missing route param fallback', () => {
    renderChallengeRoute('/missing-param-test')

    expect(screen.getByText('User challenge id not found.')).toBeInTheDocument()
    expect(mockGetUserChallenge).not.toHaveBeenCalled()
  })

  it('shows an invalid route param fallback', () => {
    renderChallengeRoute('/challenges/not-a-number')

    expect(screen.getByText('Invalid challenge id.')).toBeInTheDocument()
    expect(mockGetUserChallenge).not.toHaveBeenCalled()
  })

  it('shows loading UI while fetching challenge details', () => {
    const pendingChallenge = createDeferred<UserChallenge>()
    mockGetUserChallenge.mockReturnValue(pendingChallenge.promise)

    renderChallengeRoute('/challenges/42')

    expect(screen.getByText('Loading challenge...')).toBeInTheDocument()
    pendingChallenge.resolve(makeUserChallenge())
  })

  it('shows error UI when challenge detail fetch fails', async () => {
    mockGetUserChallenge.mockRejectedValue(new Error('Not found'))

    renderChallengeRoute('/challenges/42')

    expect(await screen.findByText('Could not load challenge details.')).toBeInTheDocument()
  })
})

// ChallengeRoute tests mock service and child page boundaries only; backend, DB, GPS, and OAuth are covered elsewhere.
