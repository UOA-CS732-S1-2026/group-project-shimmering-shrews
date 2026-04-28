import { useNavigate } from 'react-router-dom'
import ChallengeList from './ChallengeList'
import type { Challenge } from '../types/challenge'

export default function ChallengesRoute() {
  const navigate = useNavigate()

  const goToDetailView = (challenge: Challenge) => {
    navigate(`/challenges/${challenge.id}`)
  }

  return <ChallengeList goToDetailView={goToDetailView} />
}
