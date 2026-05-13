import { useNavigate } from 'react-router-dom'
import ChallengeList from './ChallengeList'
import type { UserChallenge } from '../types/userChallenge'

// Route wrapper for the challenge list view.
// Handles navigation to the challenge detail view when a challenge card is tapped.
// Passes the challenge via router state to avoid a redundant API call in the detail view.
export default function ChallengesRoute() {
  const navigate = useNavigate()

  const goToDetailView = (userChallenge: UserChallenge) => {
    navigate(`/challenges/${userChallenge.id}`, {
      state: { userChallenge: userChallenge }
    })
  }

  return <ChallengeList goToDetailView={goToDetailView} />
}
