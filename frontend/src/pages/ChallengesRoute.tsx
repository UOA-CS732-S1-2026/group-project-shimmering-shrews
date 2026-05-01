import { useNavigate } from 'react-router-dom'
import ChallengeList from './ChallengeList'
import type { UserChallenge } from '../types/userChallenge'

export default function ChallengesRoute() {
  const navigate = useNavigate()

  const goToDetailView = (userChallenge: UserChallenge) => {
    navigate(`/challenges/${userChallenge.id}`)
  }

  return <ChallengeList goToDetailView={goToDetailView} />
}
