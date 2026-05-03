import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChallengeDetailView from './ChallengeDetailView'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenge } from '../services/userChallenges'

export default function ChallengeRoute() {
  const navigate = useNavigate()
  const { userChallengeId } = useParams()

  const [userChallenge, setUserChallenge] = useState<UserChallenge | null>(null)
  const [error, setError] = useState<string | null>(null)

  const isLoading = userChallenge === null && error === null

  useEffect(() => {
    if (!userChallengeId) return

    let isActive = true

    getUserChallenge(userChallengeId)
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
  }, [userChallengeId])

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