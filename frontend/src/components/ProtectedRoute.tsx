import type { ReactNode } from "react";
import { useAuth } from "../context/useAuth"
import { Navigate, useLocation } from "react-router-dom"

type ProtectedRouteProps = {
  children: ReactNode;
};

export function ProtectedRoute({ children }: ProtectedRouteProps)  {
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

  return children;
}