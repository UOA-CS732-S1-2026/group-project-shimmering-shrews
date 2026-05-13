import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import ChallengeDetailView from './ChallengeDetailView'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenge } from '../services/userChallenges'

// Route wrapper for the challenge detail view.
// Reads the challenge ID from the URL, fetches the challenge data, and renders ChallengeDetailView.
// Uses a challenge passed via router state if available to avoid an unnecessary API call.
export default function ChallengeRoute() {
  const navigate = useNavigate()
  const { userChallengeId } = useParams()

  // Convert the URL param to a number for validation and API calls
  const normalisedId = userChallengeId ? Number(userChallengeId) : null
  const hasInvalidChallengeId =
    normalisedId !== null &&
    (!Number.isInteger(normalisedId) || normalisedId <= 0)

  const location = useLocation()

  // Use challenge passed via router state if navigating from the map view. Avoids a redundant fetch
  const passedUserChallenge = location.state?.userChallenge

  const [loadedUserChallenge, setLoadedUserChallenge] = useState<UserChallenge | null>(null)
  const [errorState, setErrorState] = useState<{
    id: number
    message: string
  } | null>(null)

  const matchingPassedUserChallenge =
    passedUserChallenge?.id === normalisedId ? passedUserChallenge : null
  const matchingLoadedUserChallenge =
    loadedUserChallenge?.id === normalisedId ? loadedUserChallenge : null
  const userChallenge = matchingPassedUserChallenge ?? matchingLoadedUserChallenge
  const error = errorState?.id === normalisedId ? errorState.message : null

  // Loading is inferred from both challenge and error being null
  const isLoading = userChallenge === null && error === null

  useEffect(() => {
    if (normalisedId === null || hasInvalidChallengeId) return

    // Use the passed challenge if its ID matches the URL param
    if (matchingPassedUserChallenge) {
      return
    }

    let isActive = true

    getUserChallenge(String(normalisedId))
      .then((data) => {
        if (!isActive) return
        setLoadedUserChallenge(data)
      })
      .catch(() => {
        if (!isActive) return
        setErrorState({
          id: normalisedId,
          message: 'Could not load challenge details.',
        })
      })

    return () => {
      isActive = false
    }
  }, [matchingPassedUserChallenge, normalisedId, hasInvalidChallengeId])

  if (!userChallengeId) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">User challenge id not found.</p>
        </div>
      </main>
    )
  }

  if (hasInvalidChallengeId) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Invalid challenge id.</p>
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
