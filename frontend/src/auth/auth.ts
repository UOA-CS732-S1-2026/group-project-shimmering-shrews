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

  const res = await fetch("http://localhost:3000/api/auth/sync-user", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`
    }
  })

  return res.json()
}