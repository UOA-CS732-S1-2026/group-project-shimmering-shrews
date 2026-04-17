import type { Session, User } from "@supabase/supabase-js"
import { createContext } from "react"

export type AuthContextType = {
  user: User | null
  session: Session | null
  loading: boolean
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined)