import { useEffect, useState, type ReactNode } from "react"
import { AuthContext } from "./AuthContext"
import { isSupabaseConfigured, supabase } from "../lib/supabase"
import { syncUser } from "../services/auth"
import type { Session, User } from "@supabase/supabase-js"

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(isSupabaseConfigured)

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
