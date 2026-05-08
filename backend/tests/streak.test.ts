import { describe, expect, it } from 'vitest'
import { calculateNextStreakCount, startOfUtcDay } from '../src/utils/streak'

/**
 * Test category: Unit tests.
 *
 * These tests cover the pure UTC streak helper. They intentionally focus on UTC
 * day boundaries and timezone edge cases without requiring users, challenges,
 * or database state.
 */
describe('streak utilities', () => {
  it('normalizes dates to UTC day boundaries', () => {
    expect(new Date(startOfUtcDay(new Date('2026-05-08T23:59:59.999Z'))).toISOString())
      .toBe('2026-05-08T00:00:00.000Z')
  })

  it('starts a streak when there is no previous completion', () => {
    expect(calculateNextStreakCount(null, 0, new Date('2026-05-08T10:00:00.000Z')))
      .toBe(1)
  })

  it('keeps the same streak when completing again on the same UTC day', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T00:05:00.000Z'),
        3,
        new Date('2026-05-08T23:55:00.000Z')
      )
    ).toBe(3)
  })

  it('increments a streak across consecutive UTC days even when local dates differ', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T23:30:00.000Z'),
        4,
        new Date('2026-05-09T00:30:00.000Z')
      )
    ).toBe(5)
  })

  it('does not increment when two completions are the same UTC day but different NZ local dates', () => {
    expect(
      calculateNextStreakCount(
        new Date('2026-05-08T11:30:00.000Z'),
        4,
        new Date('2026-05-08T13:30:00.000Z')
      )
    ).toBe(4)
  })

  it('resets the streak after a missed UTC day', () => {
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
