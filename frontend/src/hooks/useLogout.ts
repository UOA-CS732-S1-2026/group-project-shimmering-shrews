import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

// Custom hook that logs the user out and redirects them to the home page.
export const useLogout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return async () => {
    await logout()
    // Replace history entry so the user cannot navigate back to the protected page after logout
    navigate("/", { replace: true })
  }
}