import { useEffect, useState, type ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import { isSupabaseConfigured, supabase } from "../lib/supabase"
import { syncUser } from "../services/auth"
import type { Session, User } from "@supabase/supabase-js"

// When VITE_E2E_AUTH is true, the provider skips real Supabase auth and seeds a fake session.
// This allows Playwright E2E tests to bypass Google OAuth without real credentials.
const isE2EAuthEnabled = import.meta.env.VITE_E2E_AUTH === "true"

const e2eUser = {
  id: "e2e-user",
  email: "e2e@example.test",
  app_metadata: {},
  aud: "authenticated",
  created_at: "2026-05-13T00:00:00.000Z",
  user_metadata: {
    avatar_url: "/profile-placeholder.svg",
  },
} as User

const e2eSession = {
  access_token: "e2e-token",
  user: e2eUser,
} as Session


// Provides authentication state to the entire app via AuthContext.
// Handles session initialisation, auth state changes, and logout.
// In E2E mode, seeds a fake session to bypass Google OAuth during tests.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(isE2EAuthEnabled ? e2eUser : null)
  const [session, setSession] = useState<Session | null>(isE2EAuthEnabled ? e2eSession : null)
  // Skip loading state entirely in E2E mode since session is already seeded
  const [loading, setLoading] = useState(isE2EAuthEnabled ? false : isSupabaseConfigured)

  // Signs the user out and clears local auth state.
  const logout = async () => {
    setLoading(true)

    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut()

        if (error) {
          throw error
        }
      }
    } catch (error) {
      console.error("Logout failed:", error)
    } finally {
      setUser(null)
      setSession(null)
      setLoading(false)
    }
  }

  useEffect(() => {
    // Skip real auth setup in E2E mode. Fake session is already seeded
    if (isE2EAuthEnabled) {
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let isActive = true
    // Load the existing session on mount
    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) {
        return
      }

      // Sync user profile with the backend after session is loaded
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      if (data.session) {
        void syncUser().catch((error) => console.error(error))
      }
    })

    // Listen for auth state changes (login, logout, token refresh)
    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      // Sync user profile with the backend after auth state changes
      if (session) {
        void syncUser().catch((error) => console.error(error))
      }
    })

    return () => {
      isActive = false
      // Unsubscribe from auth state changes on cleanup to prevent memory leaks
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
