import { useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { getSupabaseClient } from "../lib/supabase"
import { syncUser } from "../services/auth"

// Handles the OAuth callback after Google login.
// Waits for the Supabase session to be established, syncs the user profile,
// then redirects to the page the user was trying to access before login.
const AuthCallback = () => {
    const navigate = useNavigate()

    useEffect(() => {
        // Retrieve the page the user was on before being redirected to login
        const from = sessionStorage.getItem("redirectAfterLogin") || "/"
        let isActive = true

        // Completes the login flow by syncing the user and redirecting
        const finishLogin = async () => {
            const supabase = getSupabaseClient()
            const { data } = await supabase.auth.getSession()
            const session = data.session

            if (!session || !isActive) {
                return
            }

            await syncUser().catch((error) => console.error("Failed to sync user after login:", error))

            // Clear the stored redirect path now that login is complete
            sessionStorage.removeItem("redirectAfterLogin")
            navigate(from, { replace: true })
        }

        const supabase = getSupabaseClient()

        // Also listen for auth state changes in case the session arrives asynchronously
        const { data: listener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session && isActive) {
                    await finishLogin()
                }
            }
        )

        // Attempt to finish login immediately in case session is already available
        finishLogin().catch((error) => {
            console.error("Failed to finish login callback:", error)
        })

        return () => {
            isActive = false
            // Unsubscribe from auth state changes on cleanup
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
