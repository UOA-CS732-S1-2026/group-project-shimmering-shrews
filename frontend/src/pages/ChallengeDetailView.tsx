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
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import type { UserChallenge } from '../types/userChallenge'
import {
  acceptUserChallenge,
  cancelUserChallenge,
  checkInUserChallenge,
} from '../services/userChallenges'
import { useLocationPermission } from '../hooks/useLocationPermission'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import { LOCATION_PERMISSION_CHECKIN_MESSAGE } from '../config/locationPermissionContent'

// IMPORTANT: Must match backend/src/config/constants.ts ALLOWED_COMPLETION_RADIUS_METERS
const ALLOWED_COMPLETION_RADIUS_METERS = 700

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
  const navigate = useNavigate()
  const [activeUserChallenge, setActiveUserChallenge] = useState<UserChallenge | null>(userChallenge)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { permissionStatus } = useLocationPermission()

  useEffect(() => {
    setActiveUserChallenge(userChallenge)
  }, [userChallenge])

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

  if (!activeUserChallenge) {
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

  const { challenge } = activeUserChallenge
  const isCompleted = activeUserChallenge.status === 'completed'
  const isCancelled = activeUserChallenge.status === 'cancelled'
  const isExpired = activeUserChallenge.status === 'expired'
  const isAccepted = activeUserChallenge.status === 'accepted'
  const canAccept = activeUserChallenge.status === 'in_progress' || activeUserChallenge.status === 'cancelled'
  const canCancel = activeUserChallenge.status === 'accepted'
  const isLocationBlocked = !DEV_SHOW_ALL && permissionStatus !== 'granted'
  const isCheckInDisabled = !isAccepted || isCompleted || isCancelled || isExpired || isLocationBlocked || isSubmitting

  const checkIn = () => {
    if (isCheckInDisabled) return

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const distance = getDistanceMetres(
          [latitude, longitude],
          [Number(challenge.location.latitude), Number(challenge.location.longitude)]
        )

        if (distance > ALLOWED_COMPLETION_RADIUS_METERS) {
          alert(`You are too far away (${Math.round(distance)}m). You must be within ${ALLOWED_COMPLETION_RADIUS_METERS}m of the challenge.`)
          return
        }

        try {
          setIsSubmitting(true)
          const updated = await checkInUserChallenge(
            activeUserChallenge.id,
            latitude,
            longitude
          )
          setActiveUserChallenge(updated)
          alert('Challenge sucessfully completed')
          setIsSubmitting(false)
        } catch {
          setIsSubmitting(false)
          alert('Failed to check into challenge. Please try again.')
        }
      },
      () => {
        alert('Unable to retrieve your location. Please enable location services.')
      }
    )
  }

  const acceptChallenge = () => {
    if (!canAccept || isSubmitting) return

    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.')
      return
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          setIsSubmitting(true)
          const accepted = await acceptUserChallenge(
            activeUserChallenge.id,
            latitude,
            longitude
          )
          setActiveUserChallenge(accepted)
          setIsSubmitting(false)
        } catch {
          setIsSubmitting(false)
          alert('Failed to accept challenge. Please try again.')
        }
      },
      () => {
        alert('Unable to retrieve your location. Please enable location services.')
      }
    )
  }

  const cancelChallenge = async () => {
    if (!canCancel || isSubmitting) return

    try {
      setIsSubmitting(true)
      const cancelled = await cancelUserChallenge(activeUserChallenge.id)
      setActiveUserChallenge(cancelled)
      setIsSubmitting(false)
    } catch {
      setIsSubmitting(false)
      alert('Failed to cancel challenge. Please try again.')
    }
  }

  const openRoute = () => {
    navigate(`/map?focusUserChallengeId=${activeUserChallenge.id}&returnTo=/challenges/${activeUserChallenge.id}`)
  }

  const checkInLabel = isCompleted
    ? 'COMPLETED'
    : isExpired
      ? 'EXPIRED'
    : isCancelled
      ? 'CANCELLED'
      : !isAccepted
        ? 'ACCEPT REQUIRED'
      : isLocationBlocked
        ? 'Location Required'
        : isSubmitting
          ? 'WORKING...'
          : 'CHECK IN'

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
            <span
              className={isAccepted ? 'challenge-status--accepted' : undefined}
              style={{ ...badgeStyle, background: challengeStatusColors[activeUserChallenge.status] || '#ddd' }}
            >
              {challengeStatusText[activeUserChallenge.status]}
            </span>
          </div>
        </div>
        <div>
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {canAccept && (
              <button
                onClick={acceptChallenge}
                disabled={isSubmitting}
                style={{
                  ...checkInButtonStyle,
                  marginTop: 0,
                  background: '#1463c7',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Working...' : 'ACCEPT'}
              </button>
            )}

            {isAccepted && (
              <button
                onClick={openRoute}
                style={{
                  ...checkInButtonStyle,
                  marginTop: 0,
                  background: '#7a52cc',
                }}
              >
                VIEW ROUTE
              </button>
            )}

            {canCancel && (
              <button
                onClick={cancelChallenge}
                disabled={isSubmitting}
                style={{
                  ...checkInButtonStyle,
                  marginTop: 0,
                  background: '#a32638',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                CANCEL CHALLENGE
              </button>
            )}
          </div>

          <button
            onClick={checkIn}
            disabled={isCheckInDisabled}
            title={isLocationBlocked ? 'Location access required to check in' : ''}
            style={{
              ...checkInButtonStyle,
              background: isCompleted || isCancelled || isExpired ? 'gray' : isLocationBlocked ? '#ccc' : 'green',
              cursor: isCheckInDisabled ? 'not-allowed' : 'pointer',
              opacity: isCheckInDisabled ? 0.6 : 1,
            }}
          >
            {checkInLabel}
          </button>
          {isAccepted && (
            <p style={{ fontSize: '0.9rem', color: '#5c4799', marginTop: '0.5rem' }}>
              You are on the way. Use View Route, then return here to check in.
            </p>
          )}
          {!isAccepted && !isCompleted && !isCancelled && !isExpired && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>
              Accept this challenge first to enable check in.
            </p>
          )}
          {isExpired && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem' }}>
              This challenge expired at the end of its assigned day.
            </p>
          )}
          {isLocationBlocked && (
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem' }}>
              {LOCATION_PERMISSION_CHECKIN_MESSAGE}
            </p>
          )}
        </div>
      </div>

      <button onClick={goToChallengeList} style={buttonStyle}>
        Return to list
      </button>
    </div>
  )
}
