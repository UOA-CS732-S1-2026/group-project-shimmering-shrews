export type TabKey = 'badges' | 'history'

export type UserProfile = {
  name: string
  xp: number
  level: number
  streak: number
  badges: number
  challengesCompleted: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  avatarUrl: string
}

export type Stat = {
  label: string
  value: number | string
  helper: string
}

export type Badge = {
  id: number
  name: string
  description: string
  icon: string
  earned: boolean
}

export type HistoryItem = {
  id: number
  title: string
  detail: string
  xp: number
}
