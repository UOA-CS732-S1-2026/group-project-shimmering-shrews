import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../src/daos/locationDao', () => ({
  createLocations: vi.fn(),
}))

import { createLocations } from '../src/daos/locationDao'
import { addLocations, fetchLocations } from '../src/services/locationService'

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
    vi.clearAllMocks()
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

    await expect(fetchLocations()).rejects.toThrow('Geoapify error: 429')
    errorSpy.mockRestore()
  })

  it('maps fetched places before creating location records', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: vi.fn().mockResolvedValue(geoapifyResponse),
      })
    )
    vi.mocked(createLocations).mockResolvedValue({ count: 1 } as any)

    await expect(addLocations('catering.cafe', 1)).resolves.toEqual({ count: 1 })
    expect(createLocations).toHaveBeenCalledWith([
      {
        name: 'Cafe One',
        latitude: -36.852,
        longitude: 174.765,
        category: 'catering.cafe',
      },
    ])
  })
})
