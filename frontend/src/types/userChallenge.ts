import type { Challenge } from "./challenge"

export type UserChallenge = {
  user_id: number
  challenge_id: number
  status: string
  xp_worth: number
  assigned_at: Date
  completed_at?: Date | null
  skipped_at?: Date | null
  assigned_date: Date
  id: number
  challenge: Challenge
}
