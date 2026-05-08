import { beforeEach, describe, expect, it, vi } from 'vitest'
import { locationDaoMocks } from './helpers/daoMocks'
import { addLocations, fetchLocations } from '../src/services/locationService'

/**
 * Test category: Unit tests.
 *
 * These tests cover the location service with fetch and DAO calls mocked. They
 * verify Geoapify request construction, error propagation, empty responses,
 * payload validation, coordinate boundaries, and database-write orchestration
 * without performing real HTTP requests or database writes.
 */
const geoapifyResponse = {
  features: [
    {
      properties: { name: 'Cafe One' },
      geometry: { coordinates: [174.765, -36.852] },
    },
  ],
}

describe('locationService', () => {
  beforeEach(() => {
    vi.resetAllMocks()
    vi.stubEnv('GEOAPIFY_KEY', 'geoapify-test-key')
  })

  it('fetches places from Geoapify using the configured category and limit', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue(geoapifyResponse),
    })
    vi.stubGlobal('fetch', fetchMock)

    await expect(fetchLocations('catering.cafe', 2)).resolves.toBe(
      geoapifyResponse.features
    )

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('categories=catering.cafe')
    )
    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining('limit=2'))
    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining('apiKey=geoapify-test-key')
    )
  })

  it('throws when Geoapify returns a non-success response', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: false,
        status: 429,
      })
    )

    try {
      await expect(fetchLocations()).rejects.toThrow('Geoapify error: 429')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('propagates network failures from Geoapify', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network timeout')))

    try {
      await expect(fetchLocations()).rejects.toThrow('network timeout')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('propagates invalid JSON responses from Geoapify', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockRejectedValue(new SyntaxError('Unexpected token <')),
      })
    )

    try {
      await expect(fetchLocations()).rejects.toThrow('Unexpected token <')
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('rejects malformed Geoapify payloads without a features array', async () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({}),
      })
    )

    try {
      await expect(fetchLocations()).rejects.toThrow(
        'Geoapify response missing features array'
      )
    } finally {
      errorSpy.mockRestore()
    }
  })

  it('returns empty feature arrays without treating them as errors', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ features: [] }),
      })
    )

    await expect(fetchLocations()).resolves.toEqual([])
  })

  it('maps fetched places before creating location records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(geoapifyResponse),
      })
    )
    locationDaoMocks.createLocations.mockResolvedValue({ count: 1 } as any)

    await expect(addLocations('catering.cafe', 1)).resolves.toEqual({ count: 1 })
    expect(locationDaoMocks.createLocations).toHaveBeenCalledWith([
      {
        name: 'Cafe One',
        latitude: -36.852,
        longitude: 174.765,
        category: 'catering.cafe',
      },
    ])
  })

  it('does not call the DAO when Geoapify returns no places', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({ features: [] }),
      })
    )

    await expect(addLocations('catering.cafe', 1)).resolves.toEqual({ count: 0 })
    expect(locationDaoMocks.createLocations).not.toHaveBeenCalled()
  })

  it('accepts coordinate boundary values from Geoapify', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          features: [
            {
              properties: { name: 'South West Boundary' },
              geometry: { coordinates: [-180, -90] },
            },
            {
              properties: { name: 'North East Boundary' },
              geometry: { coordinates: [180, 90] },
            },
          ],
        }),
      })
    )
    locationDaoMocks.createLocations.mockResolvedValue({ count: 2 } as any)

    await expect(addLocations('catering.cafe', 2)).resolves.toEqual({ count: 2 })
    expect(locationDaoMocks.createLocations).toHaveBeenCalledWith([
      {
        name: 'South West Boundary',
        latitude: -90,
        longitude: -180,
        category: 'catering.cafe',
      },
      {
        name: 'North East Boundary',
        latitude: 90,
        longitude: 180,
        category: 'catering.cafe',
      },
    ])
  })

  it('rejects invalid coordinates before creating locations', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue({
          features: [
            {
              properties: { name: 'Bad Place' },
              geometry: { coordinates: [174.765, 91] },
            },
          ],
        }),
      })
    )

    await expect(addLocations('catering.cafe', 1)).rejects.toThrow(
      'Invalid latitude from Geoapify response'
    )
    expect(locationDaoMocks.createLocations).not.toHaveBeenCalled()
  })
})
