import { getSupabaseClient } from "../lib/supabase"
import type { Badge, HistoryItem } from "../types/profile"
import { getTimeZoneHeaders } from "./timeZone"

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

type BackendProfile = {
  name: string
  xp: number
  level: number
  streak: number
  badges: number
  challengesCompleted: number
  xpForCurrentLevel: number
  xpForNextLevel: number
  badgeItems: Badge[]
  historyItems: HistoryItem[]
}

const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL

  if (!url) {
    throw new Error("VITE_BACKEND_URL is not configured")
  }

  return url
}

export type LiveProfile = BackendProfile

const getToken = async () => {
  if (import.meta.env.VITE_E2E_AUTH === 'true') {
    return 'e2e-token'
  }

  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error("No authenticated session found")
  }

  return token
}

export const getMyProfile = async (): Promise<LiveProfile> => {
  const token = await getToken()

  const res = await fetch(`${getBackendUrl()}/api/profile/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...getTimeZoneHeaders(),
    },
  })

  if (!res.ok) {
    let message = "Failed to fetch profile"

    try {
      const errorJson = (await res.json()) as { message?: string }

      if (errorJson.message) {
        message = errorJson.message
      }
    } catch {
      // Fall back to the generic message when the response body is not JSON.
    }

    throw new Error(message)
  }

  const json = (await res.json()) as ApiResponse<BackendProfile>

  return json.data
}

export type LeaderboardEntry = {
  rank: number
  username: string
  xp_earned: number
  level: number
  isCurrentUser?: boolean
}

export type Leaderboard = {
  topUsers: LeaderboardEntry[]
  currentUserRank: Omit<LeaderboardEntry, 'isCurrentUser'> | null
}

export const getLeaderboard = async (): Promise<Leaderboard> => {
  const token = await getToken()

  const res = await fetch(`${getBackendUrl()}/api/user/leaderboard`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Failed to fetch leaderboard')

  const json = (await res.json()) as ApiResponse<Leaderboard>
  return json.data
}
