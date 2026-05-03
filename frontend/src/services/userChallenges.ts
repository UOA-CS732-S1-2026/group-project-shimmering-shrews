import type { UserChallenge } from '../types/userChallenge'
import { getSupabaseClient } from '../lib/supabase'


type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL

  if (!url) {
    throw new Error('VITE_BACKEND_URL is not configured')
  }

  return url
}

export const getUserChallenges = async (): Promise<UserChallenge[]> => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('User not authenticated')
  }

  const res = await fetch(`${getBackendUrl()}/user-challenges/today`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch challenges')
  }
  
  const json = await res.json()

  if (!res.ok) {
    console.error('Backend error:', json)
    throw new Error(json.message || 'Failed to fetch challenges')
  }

  return json.data ?? []
}

export const getUserChallenge = async (userChallengeId: string): Promise<UserChallenge> => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('User not authenticated')
  }

  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch challenge')
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

const getAuthToken = async () => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) {
    throw new Error('User not authenticated')
  }

  return token
}

export const acceptUserChallenge = async (
  userChallengeId: number,
  acceptedFromLat: number,
  acceptedFromLng: number
): Promise<UserChallenge> => {
  const token = await getAuthToken()

  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/accept`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ acceptedFromLat, acceptedFromLng }),
  })

  if (!res.ok) {
    throw new Error('Failed to accept challenge')
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

export const cancelUserChallenge = async (userChallengeId: number): Promise<UserChallenge> => {
  const token = await getAuthToken()

  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/cancel`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error('Failed to cancel challenge')
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}

export const checkInUserChallenge = async (
  userChallengeId: number,
  completedFromLat: number,
  completedFromLng: number
): Promise<UserChallenge> => {
  const token = await getAuthToken()

  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}/checkin`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ completedFromLat, completedFromLng }),
  })

  if (!res.ok) {
    throw new Error('Failed to check in')
  }

  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}
