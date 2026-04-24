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

    supabase.auth.getSession().then(async ({ data }) => {
      if (!isActive) {
        return
      }

      setSession(data.session)
      setUser(data.session?.user ?? null)

      if (data.session) {
        await syncUser().catch((error) => console.error(error))
      }

      if (isActive) {
        setLoading(false)
      }
    })

    const { data } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!isActive) {
        return
      }

      setLoading(true)
      setSession(session)
      setUser(session?.user ?? null)

      if (session) {
        await syncUser().catch((error) => console.error(error))
      }

      if (isActive) {
        setLoading(false)
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
