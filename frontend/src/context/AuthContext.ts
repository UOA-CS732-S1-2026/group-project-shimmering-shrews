import type { Session, User } from "@supabase/supabase-js"
import { createContext } from "react"

export type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  logout: () => Promise<void>
}

// React context that provides authentication state to the entire app.
// Consumed via the useAuth hook, do not use directly.
export const AuthContext = createContext<AuthContextType | undefined>(undefined)