import { cleanup, fireEvent, render, screen } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import MapView from '../pages/MapView'
import { getRoute } from '../services/routingService'
import { getUserChallenge, getUserChallenges } from '../services/userChallenges'
import type { UserChallenge } from '../types/userChallenge'

vi.mock('leaflet', () => ({
  default: {
    divIcon: vi.fn(() => ({})),
    latLngBounds: vi.fn((points: unknown) => points),
  },
}))

vi.mock('react-leaflet', () => ({
  Circle: () => <div data-testid="accuracy-circle" />,
  CircleMarker: ({ children }: { children?: ReactNode }) => (
    <div data-testid="user-location-marker">{children}</div>
  ),
  MapContainer: ({ children }: { children?: ReactNode }) => (
    <div data-testid="map-container">{children}</div>
  ),
  Marker: ({ children }: { children?: ReactNode }) => (
    <div data-testid="challenge-marker">{children}</div>
  ),
  Polyline: () => <div data-testid="route-line" />,
  Popup: ({ children }: { children?: ReactNode }) => <div>{children}</div>,
  TileLayer: () => <div data-testid="tile-layer" />,
  useMap: () => ({
    fitBounds: vi.fn(),
    setView: vi.fn(),
  }),
}))

vi.mock('react-leaflet-cluster', () => ({
  default: ({ children }: { children?: ReactNode }) => (
    <div data-testid="marker-cluster">{children}</div>
  ),
}))

vi.mock('../services/routingService', () => ({
  getRoute: vi.fn(),
}))

vi.mock('../services/userChallenges', () => ({
  getUserChallenge: vi.fn(),
  getUserChallenges: vi.fn(),
}))

const mockGetRoute = vi.mocked(getRoute)
const mockGetUserChallenge = vi.mocked(getUserChallenge)
const mockGetUserChallenges = vi.mocked(getUserChallenges)

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

function mockPermissionsQuery(state: PermissionState) {
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn().mockResolvedValue({
        state,
        onchange: null,
      } as PermissionStatus),
    },
  })
}

function mockSuccessfulGeolocation(latitude = -36.8406, longitude = 174.7677) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((success: PositionCallback) => {
        success({
          coords: {
            accuracy: 12,
            latitude,
            longitude,
          },
        } as GeolocationPosition)
      }),
    },
  })
}

function mockFailingGeolocation(code: number) {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        error({
          code,
          PERMISSION_DENIED: 1,
          POSITION_UNAVAILABLE: 2,
          TIMEOUT: 3,
        } as GeolocationPositionError)
      }),
    },
  })
}

function renderMapView(initialEntry = '/map') {
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <MapView />
    </MemoryRouter>
  )
}

describe('MapView', () => {
  const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})

  afterEach(() => {
    cleanup()
  })

  beforeEach(() => {
    vi.clearAllMocks()
    mockGetRoute.mockResolvedValue([])
    mockGetUserChallenge.mockResolvedValue(makeUserChallenge())
    mockGetUserChallenges.mockResolvedValue([makeUserChallenge()])
  })

  it('loads the current location and renders nearby mocked challenges', async () => {
    mockPermissionsQuery('granted')
    mockSuccessfulGeolocation()

    renderMapView()

    expect(screen.getByText('Loading your location...')).toBeInTheDocument()
    expect(await screen.findByText('Visit the waterfront')).toBeInTheDocument()
    expect(screen.getByText('You are here')).toBeInTheDocument()
    expect(mockGetUserChallenges).toHaveBeenCalledWith(-36.8406, 174.7677, 0.5)
  })

  it('shows permission denied fallback UI', async () => {
    mockPermissionsQuery('denied')
    mockSuccessfulGeolocation()

    renderMapView()

    expect(await screen.findByText('Location access is required')).toBeInTheDocument()
    expect(screen.getByText('Location access denied.')).toBeInTheDocument()
    expect(mockGetUserChallenges).not.toHaveBeenCalled()
  })

  it('shows a geolocation failure message after the user allows the prompt', async () => {
    mockPermissionsQuery('prompt')
    mockFailingGeolocation(2)

    renderMapView()
    fireEvent.click(await screen.findByRole('button', { name: /enable location/i }))
    fireEvent.click(screen.getByRole('button', { name: /allow/i }))

    expect(await screen.findByText('Could not determine your location. Please check device location services and try again.')).toBeInTheDocument()
    expect(consoleError).toHaveBeenCalledWith(
      'Error getting location:',
      expect.any(Object)
    )
    expect(mockGetUserChallenges).not.toHaveBeenCalled()
  })

  it('renders the map fallback when there are no nearby challenges', async () => {
    mockPermissionsQuery('granted')
    mockSuccessfulGeolocation()
    mockGetUserChallenges.mockResolvedValue([])

    renderMapView()

    expect(await screen.findByTestId('map-container')).toBeInTheDocument()
    expect(screen.getByText('You are here')).toBeInTheDocument()
    expect(screen.queryByText('Nearby Challenge')).not.toBeInTheDocument()
  })

  it('shows a map challenge loading fallback when the challenge service fails', async () => {
    mockPermissionsQuery('granted')
    mockSuccessfulGeolocation()
    mockGetUserChallenges.mockRejectedValue(new Error('Map service failed'))

    renderMapView()

    expect(await screen.findByText('Could not load challenges for the map.')).toBeInTheDocument()
  })
})

// Map tests mock Leaflet, browser geolocation, and services only; real GPS, map tiles, backend, and database belong in integration tests.
