import { getSupabaseClient } from "../lib/supabase"

// Initiates the Google OAuth login flow.
// Redirects the user to Google's sign-in page and back to /auth/callback on completion.
// prompt: "select_account" forces the account picker to show even if already signed in.
export const loginWithGoogle = async () => {
  const supabase = getSupabaseClient()
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        prompt: "select_account"
      }
    }
  })

  if (error) console.error(error)
}

// Syncs the authenticated user's profile with the backend after login.
// Sends the Supabase session token to the backend to create or update the user record.
export const syncUser = async () => {
  const supabase = getSupabaseClient()
  const { data } = await supabase.auth.getSession()
  const token = data.session?.access_token
  // No session available then skip sync
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
