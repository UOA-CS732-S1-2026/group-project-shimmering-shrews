import confetti from 'canvas-confetti'
import { getSupabaseClient } from '../lib/supabase'
import type { UserChallenge } from '../types/userChallenge'
import { getTimeZoneHeaders } from './timeZone'

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

export type ChallengeCompletionNotification = {
  type: string
  xpGained: number;
  previousXp: number;
  newXp: number;
  previousLevelXpRequired: number;
  nextLevelXpRequired: number;
  levelUp: boolean
  previousLevel: number
  newLevel: number
  xpForLevelStart: number
  xpForNextLevelStart: number
  message: string
}

export type CheckInUserChallengeResponse = {
  userChallenge: UserChallenge
  notification: ChallengeCompletionNotification | null
}

const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL

  if (!url) {
    throw new Error('VITE_BACKEND_URL is not configured')
  }

  return url
}

const getToken = async () => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('User not authenticated')
  }

  return token
}

const getErrorMessage = async (response: Response, fallbackMessage: string) => {
  try {
    const json = (await response.json()) as { message?: string }
    return json.message || fallbackMessage
  } catch {
    return fallbackMessage
  }
}

export const getUserChallenges = async (
  lat?: number,
  lng?: number,
  radiusKm?: number
): Promise<UserChallenge[]> => {
  const token = await getToken()
  const params = new URLSearchParams()

  if (lat !== undefined) {
    params.set('lat', String(lat))
  }
  if (lng !== undefined) {
    params.set('lng', String(lng))
  }
  if (radiusKm !== undefined) {
    params.set('radius', String(radiusKm))
  }

  const queryString = params.toString()
  const url = `${getBackendUrl()}/user-challenges/today${queryString ? `?${queryString}` : ''}`
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      ...getTimeZoneHeaders(),
    },
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to fetch challenges'))
  }

  const json = (await res.json()) as ApiResponse<UserChallenge[]>
  return json.data ?? []
}

export const getUserChallenge = async (userChallengeId: string): Promise<UserChallenge> => {
  const token = await getToken()
  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to fetch challenge'))
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

export const acceptUserChallenge = async (
  userChallengeId: number,
  acceptedFromLat: number,
  acceptedFromLng: number
): Promise<UserChallenge> => {
  const token = await getToken()
  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ acceptedFromLat, acceptedFromLng }),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to accept challenge'))
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

export const cancelUserChallenge = async (userChallengeId: number): Promise<UserChallenge> => {
  const token = await getToken()
  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to cancel challenge'))
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

export const checkInUserChallenge = async (
  userChallengeId: number,
  completedFromLat: number,
  completedFromLng: number
): Promise<CheckInUserChallengeResponse> => {
  const token = await getToken()
  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...getTimeZoneHeaders(),
    },
    body: JSON.stringify({ completedFromLat, completedFromLng }),
  })

  if (!res.ok) {
    throw new Error(await getErrorMessage(res, 'Failed to check in'))
  }

  const json = (await res.json()) as ApiResponse<CheckInUserChallengeResponse>


  confetti({
    particleCount: 180,
    spread: 100,
    origin: { y: 0.6 },
  });

  return json.data
}
