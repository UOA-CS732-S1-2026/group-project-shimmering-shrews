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
import { useLocationPermission } from '../hooks/useLocationPermission'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import { LOCATION_PERMISSION_CHECKIN_MESSAGE } from '../config/locationPermissionContent'

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
  const { permissionStatus } = useLocationPermission()

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
  const maxDistance = 700
  const isCompleted = userChallenge.status === 'completed'
  const isLocked = userChallenge.status !== 'in_progress'
  const isLocationBlocked = !DEV_SHOW_ALL && permissionStatus !== 'granted'
  const isCheckInDisabled = isCompleted || isLocked || isLocationBlocked

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

        if (distance > maxDistance) {
          alert(`You are too far away (${Math.round(distance)}m). You must be within ${maxDistance}m of the challenge.`)
          return
        }

        try {
          await checkInChallenge(challenge.id)
          alert('Challenge sucessfully completed')
          window.location.reload()
        } catch {
          alert('Failed to check into challenge. Please try again.')
        }
      },
      () => {
        alert('Unable to retrieve your location. Please enable location services.')
      }
    )
  }

  const checkInLabel = isCompleted
    ? 'COMPLETED'
    : isLocked
      ? 'NOT AVAILABLE'
      : isLocationBlocked
        ? 'Location Required'
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
            <span style={{ ...badgeStyle, background: challengeStatusColors[userChallenge.status] || '#ddd' }}>
              {challengeStatusText[userChallenge.status]}
            </span>
          </div>
        </div>
        <div>
          <button
            onClick={checkIn}
            disabled={isCheckInDisabled}
            title={isLocationBlocked ? 'Location access required to check in' : ''}
            style={{
              ...checkInButtonStyle,
              background: isCompleted ? 'gray' : isLocationBlocked ? '#ccc' : 'green',
              cursor: isCheckInDisabled ? 'not-allowed' : 'pointer',
              opacity: isCheckInDisabled ? 0.6 : 1,
            }}
          >
            {checkInLabel}
          </button>
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
