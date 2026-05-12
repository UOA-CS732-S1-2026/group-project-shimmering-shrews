import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import ChallengeDetailView from '../pages/ChallengeDetailView'
import {
  acceptUserChallenge,
  checkInUserChallenge,
} from '../services/userChallenges'
import { LOCATION_PERMISSION_CHECKIN_MESSAGE } from '../config/locationPermissionContent'
import type { UserChallenge } from '../types/userChallenge'

vi.mock('../services/userChallenges', () => ({
  acceptUserChallenge: vi.fn(),
  cancelUserChallenge: vi.fn(),
  checkInUserChallenge: vi.fn(),
}))

let mockPermissionStatus: 'not-asked' | 'granted' | 'denied' = 'granted'

vi.mock('../hooks/useLocationPermission', () => ({
  useLocationPermission: () => ({
    permissionStatus: mockPermissionStatus,
    requestPermission: vi.fn(),
    userLocation: null,
  }),
}))

const mockAcceptUserChallenge = vi.mocked(acceptUserChallenge)
const mockCheckInUserChallenge = vi.mocked(checkInUserChallenge)

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

function renderChallengeDetail(userChallenge: UserChallenge | null) {
  return render(
    <MemoryRouter>
      <ChallengeDetailView
        userChallenge={userChallenge}
        goToChallengeList={vi.fn()}
      />
    </MemoryRouter>
  )
}

function mockSuccessfulGeolocation(latitude = -36.8406, longitude = 174.7677) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: {
            latitude,
            longitude,
          },
        } as GeolocationPosition)
      }),
    },
  })
}

function mockFailingGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        error({ code: 2 } as GeolocationPositionError)
      }),
    },
  })
}

function mockPendingGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn(),
    },
  })
}

describe('ChallengeDetailView', () => {
  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockPermissionStatus = 'granted'
    mockSuccessfulGeolocation()
  })

  describe('frontend rendering', () => {
    it('renders the selected challenge details', () => {
      renderChallengeDetail(makeUserChallenge())

      expect(screen.getByRole('heading', { name: /challenge details/i })).toBeInTheDocument()
      expect(screen.getByText('Visit the waterfront')).toBeInTheDocument()
      expect(screen.getByText('Take a short walk by the water.')).toBeInTheDocument()
      expect(screen.getByText('Location: Auckland Waterfront')).toBeInTheDocument()
      expect(screen.getByText('Outdoor')).toBeInTheDocument()
      expect(screen.getByText('50 XP')).toBeInTheDocument()
      expect(screen.getByText('In Progress')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /accept/i })).toBeInTheDocument()
    })

    it('shows a loading state while an action request is pending', async () => {
      const acceptedChallenge = makeUserChallenge({ status: 'accepted' })
      const pendingAccept = createDeferred<UserChallenge>()
      mockAcceptUserChallenge.mockReturnValue(pendingAccept.promise)

      renderChallengeDetail(makeUserChallenge())
      fireEvent.click(screen.getByRole('button', { name: /accept/i }))

      const loadingButtons = await screen.findAllByRole('button', { name: /working/i })
      expect(loadingButtons).toHaveLength(2)
      expect(loadingButtons.every((button) => button.hasAttribute('disabled'))).toBe(true)

      pendingAccept.resolve(acceptedChallenge)
      await waitFor(() => {
        expect(screen.getByText('Accepted')).toBeInTheDocument()
      })
    })
  })

  describe('API/service request handling', () => {
    it('calls the check-in service with the challenge id and current coordinates', async () => {
      const completedChallenge = makeUserChallenge({ status: 'completed' })
      mockCheckInUserChallenge.mockResolvedValue({
        userChallenge: completedChallenge,
        notification: {
          level: {
            type: 'challenge_completed',
            xpGained: 50,
            levelUp: false,
            previousLevel: 1,
            newLevel: 1,
            message: 'Nice work. You earned 50 XP.',
          },
          badgesAwarded: [],
        },
      })

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      await waitFor(() => {
        expect(mockCheckInUserChallenge).toHaveBeenCalledWith(42, -36.8406, 174.7677)
      })
    })

    it('shows an error message when the check-in request fails', async () => {
      mockCheckInUserChallenge.mockRejectedValue(new Error('Check-in service unavailable'))

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      expect(await screen.findByText('Check-in service unavailable')).toBeInTheDocument()
    })

    it('shows a loading state while waiting for browser location access', async () => {
      mockPendingGeolocation()

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      const loadingButton = await screen.findByRole('button', { name: /working/i })
      expect(loadingButton).toBeDisabled()
      expect(mockCheckInUserChallenge).not.toHaveBeenCalled()
    })

    it('shows a fallback error when browser geolocation fails', async () => {
      mockFailingGeolocation()

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      expect(await screen.findByText('Unable to retrieve your location. Please enable location services.')).toBeInTheDocument()
      expect(mockCheckInUserChallenge).not.toHaveBeenCalled()
    })

    it('does not check in when the user is outside the allowed radius', async () => {
      mockSuccessfulGeolocation(-36.0, 174.0)

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      expect(await screen.findByText(/You are too far away/)).toHaveTextContent(
        'You must be within 700m of the challenge.'
      )
      expect(mockCheckInUserChallenge).not.toHaveBeenCalled()
    })
  })

  describe('expected response data handling', () => {
    it('displays completion response data in the expected format', async () => {
      mockCheckInUserChallenge.mockResolvedValue({
        userChallenge: makeUserChallenge({ status: 'completed' }),
        notification: {
          level: {
            type: 'challenge_completed',
            xpGained: 50,
            levelUp: false,
            previousLevel: 1,
            newLevel: 1,
            message: 'Nice work. You earned 50 XP.',
          },
          badgesAwarded: [
            {
              id: 1,
              name: 'Waterfront Wanderer',
              description: 'Completed a waterfront challenge.',
              activeUrl: null,
            },
          ],
        },
      })

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))
      fireEvent.click(screen.getByRole('button', { name: /check in/i }))

      expect(await screen.findAllByText('Completed')).toHaveLength(2)
      expect(screen.getByText('Challenge completed')).toBeInTheDocument()
      expect(screen.getByText('+50 XP')).toBeInTheDocument()
      expect(screen.getByText('Nice work. You earned 50 XP.')).toBeInTheDocument()
      expect(screen.getByText('New Badge Unlocked')).toBeInTheDocument()
      expect(screen.getByText('Waterfront Wanderer')).toBeInTheDocument()
    })
  })

  describe('error/invalid input handling', () => {
    // Frontend tests use mocked service responses only; real DB access belongs in backend/integration tests.
    it('renders a safe empty state when no challenge is provided', () => {
      renderChallengeDetail(null)

      expect(screen.getByRole('heading', { name: /challenge details/i })).toBeInTheDocument()
      expect(screen.getByText('Challenge not found.')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /return to list/i })).toBeInTheDocument()
    })

    it('handles missing optional description without crashing', () => {
      renderChallengeDetail(makeUserChallenge({
        challenge: {
          ...makeUserChallenge().challenge,
          description: null,
        },
      }))

      expect(screen.getByText('No description available.')).toBeInTheDocument()
      expect(screen.getByText('Visit the waterfront')).toBeInTheDocument()
    })

    it('shows location-required fallback UI when permission is denied', () => {
      mockPermissionStatus = 'denied'

      renderChallengeDetail(makeUserChallenge({ status: 'accepted' }))

      expect(screen.getByRole('button', { name: /location required/i })).toBeDisabled()
      expect(screen.getByText(LOCATION_PERMISSION_CHECKIN_MESSAGE)).toBeInTheDocument()
      expect(mockCheckInUserChallenge).not.toHaveBeenCalled()
    })
  })
})
