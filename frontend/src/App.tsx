import { createBrowserRouter, Navigate, RouterProvider } from "react-router-dom"

import ChallengesRoute from "./pages/ChallengesRoute"
import ChallengeRoute from "./pages/ChallengeRoute"
import LoginPage from './pages/LoginPage'
import MapView from "./pages/MapView"
import ProfilePage from './pages/ProfilePage'
import AuthCallback from "./pages/AuthCallback"
import HomePage from "./pages/HomePage"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import { AuthProvider } from "./context/AuthProvider"
import { ProtectedRoute } from "./components/ProtectedRoute"
import './App.css'

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
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "auth/callback", element: <AuthCallback /> },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      { path: "/profile", element: <ProfilePage /> },
      {
        element: <TabsLayout />,
        children: [
          { path: "map", element: <MapView /> },
          { path: "challenges", element: <ChallengesRoute /> },
          { path: "challenges/:userChallengeId", element: <ChallengeRoute /> },
        ],
      },
    ]
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