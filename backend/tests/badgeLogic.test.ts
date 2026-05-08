import { describe, expect, it } from 'vitest'
import { getBadgesToAward, type BadgeCriteria, type UserStat } from '../src/services/badgeLogic'

/**
 * Test category: Unit tests.
 *
 * These tests cover the pure badge eligibility helper in isolation. They do not
 * use Prisma, Postgres triggers, Express, or mocked DAOs; trigger/database
 * behavior is covered separately by the opt-in integration tests.
 */
const stat = (overrides: Partial<UserStat> = {}): UserStat => ({
  user_id: 1,
  category_id: 2,
  current_value: 5,
  name: 'category_challenges_completed',
  ...overrides,
})

const criterion = (overrides: Partial<BadgeCriteria> = {}): BadgeCriteria => ({
  id: 1,
  badge_id: 10,
  stat_name: 'category_challenges_completed',
  category_id: 2,
  target_value: 3,
  ...overrides,
})

describe('getBadgesToAward', () => {
  it('awards a matching category badge when the target is met', () => {
    expect(getBadgesToAward(stat(), [criterion()])).toEqual([10])
  })

  it('awards when the stat value equals the target exactly', () => {
    expect(
      getBadgesToAward(stat({ current_value: 3 }), [criterion({ target_value: 3 })])
    ).toEqual([10])
  })

  it('does not award when the stat is below the target', () => {
    expect(
      getBadgesToAward(stat({ current_value: 2 }), [criterion({ target_value: 3 })])
    ).toEqual([])
  })

  it('does not award criteria for a different stat name', () => {
    expect(
      getBadgesToAward(stat({ name: 'challenges_completed' }), [criterion()])
    ).toEqual([])
  })

  it('does not award category-specific criteria for a different category', () => {
    expect(
      getBadgesToAward(stat({ category_id: 4 }), [criterion({ category_id: 2 })])
    ).toEqual([])
  })

  it('awards global criteria with category_id 0 for any category', () => {
    expect(
      getBadgesToAward(
        stat({ category_id: 5, name: 'challenges_completed', current_value: 4 }),
        [criterion({ badge_id: 20, stat_name: 'challenges_completed', category_id: 0, target_value: 3 })]
      )
    ).toEqual([20])
  })

  it('deduplicates multiple matching criteria for the same badge', () => {
    expect(
      getBadgesToAward(stat({ current_value: 10 }), [
        criterion({ id: 1, badge_id: 30, category_id: 2, target_value: 5 }),
        criterion({ id: 2, badge_id: 30, category_id: 0, target_value: 3 }),
      ])
    ).toEqual([30])
  })

  it('returns all distinct badges that match the changed stat', () => {
    expect(
      getBadgesToAward(stat({ current_value: 10 }), [
        criterion({ id: 1, badge_id: 10, target_value: 1 }),
        criterion({ id: 2, badge_id: 11, target_value: 10 }),
        criterion({ id: 3, badge_id: 12, target_value: 11 }),
      ])
    ).toEqual([10, 11])
  })
})
