export type TabKey = 'badges' | 'history' | 'leaderboard'

export type UserProfile = {
  username: string
  xp_earned: number
  level: number
  streak_count: number
  badges: Badge[]
  challengesCompleted: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  avatarUrl: string
}

export type Stat = {
  label: string
  value: number | string
  helper?: string
}

export type Badge = {
  id: number
  name: string
  description: string
  active_icon: string
  inactive_icon: string
  earned: boolean
}

export type HistoryItem = {
  id: number
  title: string
  detail: string
  xp: number
}
