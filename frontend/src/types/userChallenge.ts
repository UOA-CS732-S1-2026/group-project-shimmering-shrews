import type { Challenge } from "./challenge"

export type UserChallengeStatus =
  | 'in_progress'
  | 'accepted'
  | 'cancelled'
  | 'skipped'
  | 'completed'

export type UserChallenge = {
  user_id: number
  challenge_id: number
  status: UserChallengeStatus
  xp_worth: number
  assigned_at: Date
  accepted_at?: Date | null
  accepted_from_lat?: number | string | null
  accepted_from_lng?: number | string | null
  completed_at?: Date | null
  cancelled_at?: Date | null
  skipped_at?: Date | null
  id: number
  challenge: Challenge
}
