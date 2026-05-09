import { describe, expect, it } from 'vitest'
import { calculateNextStreakCount, getCalendarDayDifference } from '../src/utils/streak'

/**
 * Test category: Unit tests.
 *
 * These tests cover the pure Pacific/Auckland streak helper. They intentionally
 * pin UTC instants that fall on tricky NZ local calendar-day boundaries without
 * requiring users, challenges, or database state.
 */
describe('streak utilities', () => {
  it('calculates calendar-day differences in Pacific/Auckland', () => {
    expect(
      getCalendarDayDifference(
        new Date('2026-05-08T13:30:00.000Z'),
        new Date('2026-05-08T11:30:00.000Z')
      )
    ).toBe(1)
  })

  it('starts a streak when there is no previous completion', () => {
    expect(calculateNextStreakCount(null, 0, new Date('2026-05-08T10:00:00.000Z')))
      .toBe(1)
  })

  it('keeps the same streak when completing again on the same NZ calendar day', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T00:05:00.000Z'),
        3,
        new Date('2026-05-08T11:30:00.000Z')
      )
    ).toBe(3)
  })

  it('increments a streak across consecutive NZ days even when UTC dates match', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T11:30:00.000Z'),
        4,
        new Date('2026-05-08T13:30:00.000Z')
      )
    ).toBe(5)
  })

  it('does not increment when UTC dates differ but the NZ calendar day is the same', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T23:30:00.000Z'),
        4,
        new Date('2026-05-09T00:30:00.000Z')
      )
    ).toBe(4)
  })

  it('resets the streak after a missed NZ calendar day', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T10:00:00.000Z'),
        4,
        new Date('2026-05-10T10:00:00.000Z')
      )
    ).toBe(1)
  })

  it('does not reduce a same-day streak below one', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T10:00:00.000Z'),
        0,
        new Date('2026-05-08T11:00:00.000Z')
      )
    ).toBe(1)
  })
})
