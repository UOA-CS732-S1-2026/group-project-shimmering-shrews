import type { Challenge } from '../types/challenge'
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

export const getChallenges = async (): Promise<Challenge[]> => {
  const supabase = getSupabaseClient()

  const { data } = await supabase.auth.getSession()

  const token = data.session?.access_token

  if (!token) {
    throw new Error('User not authenticated')
  }

  const res = await fetch(`${getBackendUrl()}/user-challenges/today`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  })

  if (!res.ok) {
    throw new Error('Failed to fetch challenges')
  }

  const json = await res.json()
  return json.data
}

export const getChallenge = async (challengeId: string): Promise<Challenge> => {
  const res = await fetch(`${getBackendUrl()}/challenges/${challengeId}`)

  if (!res.ok) {
    throw new Error('Failed to fetch challenge')
  }

  const json = (await res.json()) as ApiResponse<Challenge>
  return json.data
}
