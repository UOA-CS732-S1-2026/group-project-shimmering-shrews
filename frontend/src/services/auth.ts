import { supabase } from "../lib/supabase"

export const loginWithGoogle = async () => {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: window.location.origin
    }
  })

  if (error) console.error(error)
}

export const syncUser = async () => {
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token

  if (!token) return

  const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/sync-user`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`
      }
    })

    const json = await res.json()
    return json
  } catch (err) {
    console.log(err)
  }
}