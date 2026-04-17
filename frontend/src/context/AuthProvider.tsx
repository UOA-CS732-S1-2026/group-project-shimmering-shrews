import { useEffect, useState } from "react"
import { AuthContext } from "./AuthContext"
import { supabase } from "../lib/supabase"
import { syncUser } from "../services/auth"
import type { Session, User } from "@supabase/supabase-js"
import { useNavigate } from "react-router-dom"

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const navigate = useNavigate()
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(Boolean(supabase))

  const logout = async () => {
    setLoading(true)

    if (supabase) {
      await supabase.auth.signOut()
    }

    setUser(null)
    setSession(null)
    setLoading(false)

    navigate("/")
  }

  useEffect(() => {
    if (!supabase) {
      return
    }

    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setUser(data.session?.user ?? null)
      setLoading(false)

      if (data.session) syncUser()
    })

    const { data } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setUser(session?.user ?? null)

      if (session) syncUser()
    })

    return () => data.subscription.unsubscribe()
  }, [])

  return (
    <AuthContext.Provider value={{ user, session, loading, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
