import React from 'react'
import { Routes, Route } from "react-router-dom"

import ChallengeList from "./pages/ChallengeList"
import ChallengeDetailView from "./pages/ChallengeDetailView"
import LoginPage from './pages/LoginPage'
import ProfilePage from './pages/ProfilePage'
import Layout from "./layouts/MainLayout"
import TabsLayout from "./layouts/TabsLayout"
import type { Challenge } from './types/challenge'
import './App.css'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<TabsLayout />}>
        <Route index element={<ChallengeFlow />} />
        <Route path="challenges" element={<ChallengeFlow />} />
        <Route path="*" element={<ChallengeFlow />} />
      </Route>
      <Route path="/" element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
      </Route>
      <Route path="/profile" element={<ProfilePage />} />
    </Routes>
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
