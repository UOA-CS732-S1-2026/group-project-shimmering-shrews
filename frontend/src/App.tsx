import { createBrowserRouter, RouterProvider } from "react-router-dom"
import React from 'react'

import { protectedLoader } from './services/protectedLoader'
import ChallengeList from "./pages/ChallengeList"
import ChallengeDetailView from "./pages/ChallengeDetailView"
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import AuthCallback from "./pages/AuthCallback"
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import type { Challenge } from './types/challenge'
import { AuthProvider } from "./context/AuthProvider"
import './App.css'

/**
 * Within the router, we specify what layout template to use for each group of children,
 * e.g. element: <TabsLayout /> will display each of that path's children wrapped in the TabsLayout template.
 * To protect a path (and subpaths), add loader: protectedLoader. This will verify that the user is logged in.
 * If so, take them to the path they've specified, if not, then take them to the login page.
 */
const router = createBrowserRouter([
  {
    path: "/",
    element: <TabsLayout />,
    children: [
      { index: true, element: <ChallengeFlow /> },
      { path: "challenges", element: <ChallengeFlow /> },
      { path: "*", element: <ChallengeFlow /> },
    ],
  },
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "login", element: <LoginPage /> },
      { path: "/auth/callback", element: <AuthCallback /> },
    ],
  },
  {
    path: "/profile",
    element: <ProfilePage />,
    loader: protectedLoader,
  },
])

export default function App() {
  return (
    <AuthProvider>
      <RouterProvider router={router}/>
    </AuthProvider>
  )
}

function ChallengeFlow() {
  const [page, setPage] = React.useState<'ChallengeList' | 'ChallengeDetailView'>("ChallengeList")
  const [selectedChallenge, setSelectedChallenge] = React.useState<Challenge | null>(null)
  const [checkedInChallenges, setCheckedInChallenges] = React.useState<number[]>([])
  return(
    <div>
      {page === "ChallengeList" && <ChallengeList goToDetailView={(challenge) => {
        setSelectedChallenge(challenge)
        setPage("ChallengeDetailView")
      }} />}
      {page === "ChallengeDetailView" && (
        <ChallengeDetailView challenge={selectedChallenge}
        checkedInChallenges={checkedInChallenges} 
        setCheckedInChallenges={setCheckedInChallenges}
        goToChallengeList={() => {
        setPage("ChallengeList")}} />
      )
      
      }
    </div>
  )
}
