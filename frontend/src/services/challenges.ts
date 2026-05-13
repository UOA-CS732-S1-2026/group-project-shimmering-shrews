import type { Challenge } from '../types/challenge'

type ApiResponse<T> = {
  success: boolean
  data: T
  message?: string
}

// Returns the backend URL from environment variables, throwing if not configured.
const getBackendUrl = () => {
  const url = import.meta.env.VITE_BACKEND_URL

  if (!url) {
    throw new Error('VITE_BACKEND_URL is not configured')
  }

  return url
}

// Fetches all active challenges from the backend.
export const getChallenges = async (): Promise<Challenge[]> => {
  const res = await fetch(`${getBackendUrl()}/challenges`)

  if (!res.ok) {
    throw new Error('Failed to fetch challenges')
  }

  const json = (await res.json()) as ApiResponse<Challenge[]>
  return json.data
}

// Fetches a single challenge by ID from the backend.
export const getChallenge = async (challengeId: string): Promise<Challenge> => {
  const res = await fetch(`${getBackendUrl()}/challenges/${challengeId}`)

  if (!res.ok) {
    throw new Error('Failed to fetch challenge')
  }

  const json = (await res.json()) as ApiResponse<Challenge>
  return json.data
}
