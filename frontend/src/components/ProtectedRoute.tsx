import { useAuth } from "../context/useAuth"
import { Navigate, Outlet, useLocation } from "react-router-dom"

/**
 * This function is used to restrict access to pages to only logged in users.
 * To use, just wrap the element in the router which you wish to protect in <ProtectedRoute> tags.
 * 
 * If the user is logged in, serve them the page.
 * If the user is not logged in, navigate them to the login page instead.
 * 
 * Security note: This function exists purely for UI-level redirection, NOT security.
 * This runs in the client-side, so users can bypass it.
 * Therefore, it cannot be used to prevent access to sensitive data,
 * that must be done with API endpoint protection on the backend.
 * 
 */
export function ProtectedRoute()  {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <main className="container page">
        <div className="shell">
          <p className="status-message">Loading...</p>
        </div>
      </main>
    )
  }

  if (!user) {
    return (
      <Navigate
        to={`/login?from=${encodeURIComponent(location.pathname)}`}
        replace
      />
    )
  }

  return <Outlet />;
}