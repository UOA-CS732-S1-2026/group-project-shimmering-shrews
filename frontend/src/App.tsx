import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"

import ChallengesRoute from "./pages/ChallengesRoute"
import ChallengeRoute from "./pages/ChallengeRoute"
import LoginPage from './pages/LoginPage'
import MapView from "./pages/MapView"
import ProfilePage from './pages/ProfilePage'
import AuthCallback from "./pages/AuthCallback"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import { AuthProvider } from "./context/AuthProvider"
import './App.css'
import { ProtectedRoute } from "./components/ProtectedRoute"
import { useAuth } from "./context/useAuth"
import HomePage from "./pages/HomePage"

/**
 * Within the router, we specify what layout template to use for each group of children,
 * e.g. element: <TabsLayout /> will display each of that path's children wrapped in the TabsLayout template.
 * To make a path (and its children) accessible by logged in users only, wrap the element in <ProtectedRoute> tags.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <HomePage />,
  },
  {
    element: <TabsLayout />,
    children: [
      { path: "map", element: <MapView /> },
      { path: "challenges", element: <ChallengesRoute /> },
      { path: "challenges/:challengeId", element: <ChallengeRoute /> },
    ],
  },
  {
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "auth/callback", element: <AuthCallback /> },
    ],
  },
  {
    path: "/profile",
    element: (
      <ProtectedRoute>
        <ProfilePage />
      </ProtectedRoute>
    ),
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
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
