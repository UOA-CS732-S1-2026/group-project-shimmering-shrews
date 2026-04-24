import { createBrowserRouter, Navigate, RouterProvider, useLocation } from "react-router-dom"
import React from 'react'

import ChallengeList from "./pages/ChallengeList"
import ChallengeDetailView from "./pages/ChallengeDetailView"
import LoginPage from './pages/LoginPage'
import MapView from "./pages/MapView"
import ProfilePage from './pages/ProfilePage'
import AuthCallback from "./pages/AuthCallback"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import type { Challenge } from './types/challenge'
import { AuthProvider } from "./context/AuthProvider"
import { useAuth } from "./context/useAuth"
import './App.css'

const router = createBrowserRouter([
  {
    path: "/",
    element: <TabsLayout />,
    children: [
      { index: true, element: <MapView /> },
      { path: "map", element: <MapView /> },
      { path: "challenges", element: <ChallengeFlow /> },
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

function ChallengeFlow() {
  const [page, setPage] = React.useState<'ChallengeList' | 'ChallengeDetailView'>("ChallengeList")
  const [selectedChallenge, setSelectedChallenge] = React.useState<Challenge | null>(null)
  const [checkedInChallenges, setCheckedInChallenges] = React.useState<number[]>([])

  return (
    <div>
      {page === "ChallengeList" && (
        <ChallengeList
          goToDetailView={(challenge) => {
            setSelectedChallenge(challenge)
            setPage("ChallengeDetailView")
          }}
        />
      )}
      {page === "ChallengeDetailView" && (
        <ChallengeDetailView
          challenge={selectedChallenge}
          checkedInChallenges={checkedInChallenges}
          setCheckedInChallenges={setCheckedInChallenges}
          goToChallengeList={() => {
            setPage("ChallengeList")
          }}
        />
      )}
    </div>
  )
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
