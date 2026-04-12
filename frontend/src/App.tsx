import React from 'react'
import ChallengeList from "./pages/ChallengeList"
import ChallengeDetailView from "./pages/ChallengeDetailView"


export default function App() {
  const [page, setPage] = React.useState("ChallengeList")
  const [selectedChallenge, setSelectedChallenge] = React.useState(null)
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
