import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import ChallengeDetailView from './ChallengeDetailView'
import { getChallenge } from '../services/challenges'
import type { Challenge } from '../types/challenge'

export default function ChallengeRoute() {
  const navigate = useNavigate()
  const { challengeId } = useParams()
  const hasValidChallengeId = Boolean(challengeId)
  const [challenge, setChallenge] = useState<Challenge | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [checkedInChallenges, setCheckedInChallenges] = useState<number[]>([])

  useEffect(() => {
    if (!hasValidChallengeId || !challengeId) {
      return
    }

    let isActive = true

    getChallenge(challengeId)
      .then((data) => {
        if (!isActive) {
          return
        }

        setChallenge(data)
        setError(null)
      })
      .catch(() => {
        if (isActive) {
          setChallenge(null)
          setError('Could not load challenge details.')
        }
      })
      .finally(() => {
        if (isActive) {
          setLoading(false)
        }
      })

    return () => {
      isActive = false
    }
  }, [challengeId, hasValidChallengeId])

  if (!hasValidChallengeId) {
    return (
      <main className="container page page-profile">
        <div className="shell shell-profile">
          <p className="status-message">Challenge not found.</p>
        </div>
      </main>
    )
  }

  if (loading) {
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

  return (
    <ChallengeDetailView
      challenge={challenge}
      checkedInChallenges={checkedInChallenges}
      setCheckedInChallenges={setCheckedInChallenges}
      goToChallengeList={() => navigate('/challenges')}
    />
  )
}
