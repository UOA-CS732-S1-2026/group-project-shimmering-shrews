import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { supabase } from "../lib/supabase"

const AuthCallback = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const from = sessionStorage.getItem("redirectAfterLogin") || "/"

        const { data: listener } = supabase.auth.onAuthStateChange(
            (_event, session) => {
                if (session) {
                    navigate(from, { replace: true })
                }
            }
        )

        return () => {
            listener.subscription.unsubscribe()
        }
    }, [navigate])

    return (
        <p> Signing you in...</p>
    )
}

export default AuthCallback
