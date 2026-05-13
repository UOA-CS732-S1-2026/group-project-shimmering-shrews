import { useEffect, useState, type ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import { isSupabaseConfigured, supabase } from "../lib/supabase"
import { syncUser } from "../services/auth"
import type { Session, User } from "@supabase/supabase-js"

// Provides authentication state to the entire app via AuthContext.
// Handles session initialisation, auth state changes, and logout.
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  // Start in loading state only if Supabase is configured, avoids unnecessary loading on misconfigured environments
  const [loading, setLoading] = useState(isSupabaseConfigured)

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
