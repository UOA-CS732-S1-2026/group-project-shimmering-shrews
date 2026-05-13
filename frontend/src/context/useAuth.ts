import { useContext } from "react"
import { AuthContext, type AuthContextType } from "./AuthContext"

// Custom hook for accessing authentication state throughout the app.
// Must be used inside an AuthProvider, throws an error if used outside.
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext)

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }

  return context
}