export type BadgeCriteria = {
  id: number
  badge_id: number
  stat_name: string
  category_id: number
  target_value: number
}

export type UserStat = {
  user_id: number
  category_id: number
  current_value: number
  name: string
}

// Determines which badges should be awarded based on the user's current stat and badge criteria.
// Filters criteria by stat name, category (or global), and checks if the current value meets the target.
// Returns deduplicated list of badge IDs to award.
export function getBadgesToAward(userStat: UserStat, badgeCriteria: BadgeCriteria[]) {
  const eligible: number[] = []

  for (const bc of badgeCriteria) {
    if (bc.stat_name !== userStat.name) continue
    // category_id of 0 means global
    if (bc.category_id !== 0 && bc.category_id !== userStat.category_id) continue

    if (userStat.current_value >= bc.target_value) {
      eligible.push(bc.badge_id)
    }
  }

  // Deduplicate
  return Array.from(new Set(eligible))
}

export default getBadgesToAward
