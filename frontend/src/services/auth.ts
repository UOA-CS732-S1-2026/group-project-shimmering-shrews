import { getSupabaseClient } from "../lib/supabase"

export const loginWithGoogle = async () => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`
    }
  })

  if (error) console.error(error)
}

export const syncUser = async () => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) return

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
  if (!BACKEND_URL) {
    throw new Error("VITE_BACKEND_URL is not configured")
  }

  const res = await fetch(`${BACKEND_URL}/api/auth/sync-user`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  if (!res.ok) {
    throw new Error("Failed to sync user")
  }

  return res.json()
}
