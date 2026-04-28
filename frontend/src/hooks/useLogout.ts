import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/useAuth"

export const useLogout = () => {
  const { logout } = useAuth()
  const navigate = useNavigate()

  return async () => {
    await logout()
    navigate("/", { replace: true })
  }
}