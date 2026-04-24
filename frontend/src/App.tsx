import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom"

import ChallengesRoute from "./pages/ChallengesRoute"
import ChallengeRoute from "./pages/ChallengeRoute"
import LoginPage from './pages/LoginPage'
import MapView from "./pages/MapView"
import ProfilePage from './pages/ProfilePage'
import AuthCallback from "./pages/AuthCallback"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import { AuthProvider } from "./context/AuthProvider"
import { useAuth } from "./context/useAuth"
import './App.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <TabsLayout />,
    children: [
      { index: true, element: <HomeRedirect /> },
      { path: "map", element: <MapView /> },
      { path: "challenges", element: <ChallengesRoute /> },
      { path: "challenges/:challengeId", element: <ChallengeRoute /> },
      { path: "*", element: <Navigate to="/" replace /> },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "auth/callback", element: <AuthCallback /> },
    ],
  },
  {
    path: "/profile",
    element: <ProtectedProfilePage />,
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router} />
    </AuthProvider>
  )
}

function HomeRedirect() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Loading...</p>
        </div>
      </main>
    )
  }

  return <Navigate to={user ? "/profile" : "/login"} replace />
}

function ProtectedProfilePage() {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Loading profile...</p>
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

  return <ProfilePage />
}
