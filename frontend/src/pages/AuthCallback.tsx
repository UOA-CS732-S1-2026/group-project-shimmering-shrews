import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getSupabaseClient } from "../lib/supabase"
import { syncUser } from "../services/auth"

const AuthCallback = () => {
    const navigate = useNavigate()

    useEffect(() => {
        const from = sessionStorage.getItem("redirectAfterLogin") || "/"
        let isActive = true

        const finishLogin = async () => {
            const supabase = getSupabaseClient()
            const { data } = await supabase.auth.getSession()
            const session = data.session

            if (!session || !isActive) {
                return
            }

            await syncUser().catch((error) => console.error("Failed to sync user after login:", error))
            sessionStorage.removeItem("redirectAfterLogin")
            navigate(from, { replace: true })
        }

        const supabase = getSupabaseClient()
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session && isActive) {
                    await finishLogin()
                }
            }
        )

        finishLogin().catch((error) => {
            console.error("Failed to finish login callback:", error)
        })

        return () => {
            isActive = false
            listener.subscription.unsubscribe()
        }
    }, [navigate])

    return (
        <main className="container page page-profile">
            <div className="shell shell-profile">
                <p className="status-message">Signing you in...</p>
            </div>
        </main>
    )
}

export default AuthCallback
