import { useState } from 'react'
import {
  badgeStyle,
  buttonStyle,
  cardStyle,
  categoryColors,
  challengeStatusColors,
  challengeStatusText,
  challengeTitleStyle,
  containerStyle,
  titleStyle,
  xpStyle,
} from '../styles/challengeStyle'
import type { UserChallenge } from '../types/userChallenge'
import { checkInChallenge } from '../services/challenges'

const MAX_DISTANCE_METRES = 700

function getDistanceMetres(a: [number, number], b: [number, number]) {
  const R = 6371000
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x))
}

export default function ChallengeDetailView({
  userChallenge,
  goToChallengeList,
}: {
  goToChallengeList: () => void
  userChallenge: UserChallenge | null
}) {
  const [checkingIn, setCheckingIn] = useState(false)
  const [checkInError, setCheckInError] = useState<string | null>(null)
  const detailDescriptionStyle = {
    margin: '6px 0',
    color: '#555',
    textAlign: 'left',
    fontSize: '14px',
  } as const
  const checkInButtonStyle = {
    marginTop: '20px',
    padding: '10px 20px',
    borderRadius: '8px',
    background: 'green',
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'flex-end',
  } as const

  if (!userChallenge) {
    return (
      <div style={containerStyle}>
        <h1 style={titleStyle}>Challenge Details</h1>
        <p>Challenge not found.</p>
        <button onClick={goToChallengeList} style={buttonStyle}>
          Return to list
        </button>
      </div>
    )
  }

  const { challenge } = userChallenge
  const isCompleted = userChallenge.status === 'completed'
  const isLocked = userChallenge.status !== 'in_progress'

  const checkIn = () => {
    if (isLocked || checkingIn) {
      return
    }

    if (!navigator.geolocation) {
      setCheckInError('Geolocation is not supported by your browser.')
      return
    }

    setCheckingIn(true)
    setCheckInError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const distance = getDistanceMetres(
          [latitude, longitude],
          [Number(challenge.location.latitude), Number(challenge.location.longitude)]
        )

        if (distance > MAX_DISTANCE_METRES) {
          setCheckInError(
            `You are too far away (${Math.round(distance)}m). You must be within ${MAX_DISTANCE_METRES}m of the challenge.`
          )
          setCheckingIn(false)
          return
        }

        try {
          await checkInChallenge(challenge.id)
          window.location.reload()
        } catch (error) {
          setCheckInError(
            error instanceof Error ? error.message : 'Failed to check into challenge. Please try again.'
          )
        } finally {
          setCheckingIn(false)
        }
      },
      () => {
        setCheckInError('Unable to retrieve your location. Please enable location services.')
        setCheckingIn(false)
      }
    )
  }

  return (
    <div style={containerStyle}>
      <h1 style={titleStyle}>Challenge Details</h1>
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          minHeight: '500px',
          maxWidth: '500px',
          margin: '0 auto',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={challengeTitleStyle}>{challenge.name}</h2>
          <p style={detailDescriptionStyle}>{challenge.description ?? 'No description available.'}</p>
          <p style={{ margin: '10px 0' }}>Location: {challenge.location.name}</p>
          <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'center',
            }}
          >
            <span style={{ ...badgeStyle, background: categoryColors[challenge.challenge_category.name] || '#ddd' }}>
              {challenge.challenge_category.name}
            </span>
            <span style={xpStyle}>{challenge.xp_worth} XP</span>
            <span style={{ ...badgeStyle, background: challengeStatusColors[userChallenge.status] || '#ddd' }}>
              {challengeStatusText[userChallenge.status]}
            </span>
          </div>
        </div>
        <div>
          <button
            onClick={checkIn}
            disabled={isLocked || checkingIn}
            style={{
              ...checkInButtonStyle,
              background: isCompleted ? 'gray' : 'green',
              cursor: isLocked || checkingIn ? 'not-allowed' : 'pointer',
              opacity: isLocked ? 0.6 : 1,
            }}
          >
            {checkingIn ? 'CHECKING IN...' : isCompleted ? 'COMPLETED' : isLocked ? 'NOT AVAILABLE' : 'CHECK IN'}
          </button>
          {checkInError ? <p style={{ color: '#b00020', marginTop: '10px' }}>{checkInError}</p> : null}
        </div>
      </div>

      <button onClick={goToChallengeList} style={buttonStyle}>
        Return to list
      </button>
    </div>
  )
}
