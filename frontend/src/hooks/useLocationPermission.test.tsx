import { act, cleanup, renderHook, waitFor } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'

import { useLocationPermission } from './useLocationPermission'

function mockPermissionsQuery(state: PermissionState) {
  const permissionStatus = {
    state,
    onchange: null,
  } as PermissionStatus

  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: {
      query: vi.fn().mockResolvedValue(permissionStatus),
    },
  })

  return permissionStatus
}

function mockNoPermissionsApi() {
  Object.defineProperty(navigator, 'permissions', {
    configurable: true,
    value: undefined,
  })
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

function mockDeniedGeolocation() {
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: vi.fn((_success: PositionCallback, error: PositionErrorCallback) => {
        error({
          code: 1,
          PERMISSION_DENIED: 1,
        } as GeolocationPositionError)
      }),
    },
  })
}

describe('useLocationPermission', () => {
  afterEach(() => {
    cleanup()
    vi.restoreAllMocks()
  })

  it('handles successful mocked permission and location retrieval', async () => {
    mockPermissionsQuery('granted')
    mockSuccessfulGeolocation()

    const { result } = renderHook(() => useLocationPermission())

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('granted')
      expect(result.current.userLocation).toEqual([-36.8406, 174.7677])
    })
  })

  it('handles denied location permission when requesting access', async () => {
    mockNoPermissionsApi()
    mockDeniedGeolocation()

    const { result } = renderHook(() => useLocationPermission())

    act(() => {
      result.current.requestPermission()
    })

    await waitFor(() => {
      expect(result.current.permissionStatus).toBe('denied')
      expect(result.current.userLocation).toBeNull()
    })
  })
})

// Location tests mock browser permission/geolocation APIs only; real GPS, backend, and database behavior belongs in integration tests.
