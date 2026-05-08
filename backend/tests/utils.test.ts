import { describe, expect, it, vi } from 'vitest'
import { asyncHandler } from '../src/utils/asyncHandler'
import { ApiError } from '../src/utils/ApiError'
import {
  calculateLevel,
  getXpForLevelStart,
  getXpForNextLevel,
  getXpRequiredForNextLevel,
} from '../src/utils/leveling'
import { mapLocations } from '../src/utils/mapLocations'
import { mapPlace } from '../src/utils/mapPlaces'
import {
  generateExploratoryUsername,
  isExploratoryUsername,
} from '../src/utils/username'
import { errorHandler } from '../src/middleware/errorMiddleWare'
import { requireSelf } from '../src/middleware/auth'
import type { NextFunction } from 'express'

type MockNext = ReturnType<typeof vi.fn> & NextFunction
const createNext = () => vi.fn() as unknown as MockNext

describe('leveling utilities', () => {
  it('calculates level boundaries from cumulative XP', () => {
    expect(calculateLevel(-10)).toBe(1)
    expect(calculateLevel(0)).toBe(1)
    expect(calculateLevel(29)).toBe(1)
    expect(calculateLevel(30)).toBe(2)
    expect(calculateLevel(74)).toBe(2)
    expect(calculateLevel(75)).toBe(3)
  })

  it('calculates XP thresholds for each level', () => {
    expect(getXpRequiredForNextLevel(1)).toBe(30)
    expect(getXpRequiredForNextLevel(2)).toBe(45)
    expect(getXpRequiredForNextLevel(0)).toBe(30)
    expect(getXpForLevelStart(1)).toBe(0)
    expect(getXpForLevelStart(3)).toBe(75)
    expect(getXpForNextLevel(2)).toBe(75)
  })
})

describe('username utilities', () => {
  it('generates usernames that match the exploratory username pattern', () => {
    expect(isExploratoryUsername(generateExploratoryUsername())).toBe(true)
  })

  it('rejects usernames outside the generated pattern', () => {
    expect(isExploratoryUsername('plain-user')).toBe(false)
    expect(isExploratoryUsername('City_Scout-1')).toBe(false)
  })
})

describe('location mappers', () => {
  it('maps Geoapify places into database location input', () => {
    expect(
      mapPlace(
        {
          properties: { name: 'Cafe One' },
          geometry: { coordinates: [174.765, -36.852] },
        },
        'catering.cafe'
      )
    ).toEqual({
      name: 'Cafe One',
      latitude: -36.852,
      longitude: 174.765,
      category: 'catering.cafe',
    })
  })

  it('uses a fallback name when a Geoapify place is unnamed', () => {
    expect(
      mapPlace(
        {
          properties: {},
          geometry: { coordinates: [174.765, -36.852] },
        },
        'catering.cafe'
      ).name
    ).toBe('Unnamed location')
  })

  it('maps supported location categories into challenge inputs', () => {
    const categoryIds = { food: 1, fitness: 2, social: 3 }

    expect(
      mapLocations(
        { id: 10, name: 'Lunch Stop', category: 'catering.restaurant' },
        categoryIds
      )
    ).toMatchObject({
      name: 'Grab a bite',
      location_id: 10,
      category_id: 1,
      xp_worth: 10,
    })

    expect(
      mapLocations(
        { id: 11, name: 'Community Hall', category: 'leisure.community_centre' },
        categoryIds
      )
    ).toMatchObject({
      name: 'Talk to a stranger',
      location_id: 11,
      category_id: 3,
      xp_worth: 15,
    })

    expect(
      mapLocations(
        { id: 12, name: 'Gym', category: 'sports.fitness_centre' },
        categoryIds
      )
    ).toMatchObject({
      name: 'Workout session',
      location_id: 12,
      category_id: 2,
      xp_worth: 20,
    })
  })

  it('rejects unsupported location categories', () => {
    expect(() =>
      mapLocations(
        { id: 13, name: 'Library', category: 'education.library' },
        { food: 1, fitness: 2, social: 3 }
      )
    ).toThrow("Unsupported location category 'education.library' for Library")
  })
})

describe('asyncHandler', () => {
  it('runs successful async handlers', async () => {
    const req = {} as any
    const res = {} as any
    const next = createNext()
    const handler = vi.fn().mockResolvedValue('done')

    await asyncHandler(handler)(req, res, next)

    expect(handler).toHaveBeenCalledWith(req, res, next)
    expect(next).not.toHaveBeenCalled()
  })

  it('forwards async failures to next', async () => {
    const error = new Error('boom')
    const next = createNext()
    const handler = vi.fn().mockRejectedValue(error)

    await asyncHandler(handler)({} as any, {} as any, next)

    expect(next).toHaveBeenCalledWith(error)
  })
})

describe('errorHandler', () => {
  it('returns ApiError status and message', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))

    errorHandler(
      new ApiError(409, 'Conflict'),
      {} as any,
      { status } as any,
      createNext()
    )

    expect(status).toHaveBeenCalledWith(409)
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Conflict' })
    errorSpy.mockRestore()
  })

  it('returns a 500 status for ordinary errors', () => {
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))

    errorHandler(new Error('Unexpected'), {} as any, { status } as any, createNext())

    expect(status).toHaveBeenCalledWith(500)
    expect(json).toHaveBeenCalledWith({ success: false, message: 'Unexpected' })
    errorSpy.mockRestore()
  })
})

describe('requireSelf', () => {
  it('continues when the route id matches the authenticated subject', () => {
    const next = createNext()

    requireSelf({ params: { id: 'auth-1' }, auth: { sub: 'auth-1' } } as any, {} as any, next)

    expect(next).toHaveBeenCalledTimes(1)
  })

  it('rejects access to another user id', () => {
    const json = vi.fn()
    const status = vi.fn(() => ({ json }))
    const next = createNext()

    requireSelf(
      { params: { id: 'auth-2' }, auth: { sub: 'auth-1' } } as any,
      { status } as any,
      next
    )

    expect(status).toHaveBeenCalledWith(403)
    expect(json).toHaveBeenCalledWith({ error: 'Forbidden' })
    expect(next).not.toHaveBeenCalled()
  })
})
