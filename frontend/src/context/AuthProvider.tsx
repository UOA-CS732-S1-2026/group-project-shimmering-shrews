import { useEffect, useState, type ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import { isSupabaseConfigured, supabase } from "../lib/supabase"
import { syncUser } from "../services/auth"
import type { Session, User } from "@supabase/supabase-js"

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

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(isE2EAuthEnabled ? e2eUser : null)
  const [session, setSession] = useState<Session | null>(isE2EAuthEnabled ? e2eSession : null)
  const [loading, setLoading] = useState(isE2EAuthEnabled ? false : isSupabaseConfigured)

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
    if (isE2EAuthEnabled) {
      return
    }

    if (!isSupabaseConfigured || !supabase) {
      return
    }

    let isActive = true

    supabase.auth.getSession().then(({ data }) => {
      if (!isActive) {
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      if (data.session) {
        void syncUser().catch((error) => console.error(error))
      }
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!isActive) {
        return
      }

      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)

      if (session) {
        void syncUser().catch((error) => console.error(error))
      }
    })

    return () => {
      isActive = false
      data.subscription.unsubscribe()
    }
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
