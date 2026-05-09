import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ChallengeDetailView from './ChallengeDetailView'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenge } from '../services/userChallenges'

export default function ChallengeRoute() {
  const navigate = useNavigate()
  const { userChallengeId } = useParams()
  const normalisedId = userChallengeId ? Number(userChallengeId) : null

  const location = useLocation()
  // fetch passed challenge if we came here from View Route via Challenge Detail View
  const passedUserChallenge = location.state?.userChallenge

  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLoading = userChallenge === null && error === null

  useEffect(() => {
    if (!normalisedId) return

    if (passedUserChallenge?.id === normalisedId) {
      setUserChallenge(passedUserChallenge)
      return
    }

    let isActive = true

    getUserChallenge(normalisedId)
      .then((data) => {
        if (!isActive) return
        setUserChallenge(data)
      })
      .catch(() => {
        if (!isActive) return
        setError('Could not load challenge details.')
      })

    return () => {
      isActive = false
    }
  }, [passedUserChallenge, normalisedId])

  if (!userChallengeId) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">User challenge id not found.</p>
        </div>
      </main>
    )
  }

  if (isLoading) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Loading challenge...</p>
        </div>
      </main>
    )
  }

  if (error) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">{error}</p>
        </div>
      </main>
    )
  }

  if (!userChallenge) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Challenge details not found.</p>
        </div>
      </main>
    )
  }

  return (
    <ChallengeDetailView
      userChallenge={userChallenge}
      goToChallengeList={() => navigate('/challenges')}
    />
  )
}