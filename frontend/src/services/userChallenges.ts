import type { UserChallenge } from '../types/userChallenge'
import { getSupabaseClient } from '../lib/supabase'

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL
  if (!url) throw new Error('VITE_BACKEND_URL is not configured')
  return url
}

const getToken = async () => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  if (!token) throw new Error('User not authenticated')
  return token
}

export const getUserChallenges = async (
  lat?: number,
  lng?: number,
  radiusKm?: number
): Promise<UserChallenge[]> => {
  const token = await getToken()

  const params = new URLSearchParams()
  if (lat !== undefined) params.set('lat', String(lat))
  if (lng !== undefined) params.set('lng', String(lng))
  if (radiusKm !== undefined) params.set('radius', String(radiusKm))

  const res = await fetch(`${getBackendUrl()}/user-challenges/today?${params.toString()}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  const json = await res.json()
  if (!res.ok) {
    console.error('Backend error:', json)
    throw new Error(json.message || 'Failed to fetch challenges')
  }
  return json.data ?? []
}

export const getUserChallenge = async (userChallengeId: string): Promise<UserChallenge> => {
  const token = await getToken()

  const res = await fetch(`${getBackendUrl()}/user-challenges/${userChallengeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  })

  if (!res.ok) throw new Error('Failed to fetch challenge')
  const json = (await res.json()) as ApiResponse<UserChallenge>
  return json.data
}