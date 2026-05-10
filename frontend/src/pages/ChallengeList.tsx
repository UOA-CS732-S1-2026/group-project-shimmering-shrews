import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getUserChallenges } from '../services/userChallenges'
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
import { useLocationPermission } from '../hooks/useLocationPermission'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import LocationPermissionDialog from '../components/LocationPermissionDialog.tsx'
import {
  LOCATION_PERMISSION_CHALLENGES_ACCURACY_MESSAGE,
  LOCATION_PERMISSION_DIALOG_MESSAGE,
  LOCATION_PERMISSION_DIALOG_TITLE,
  LOCATION_PERMISSION_SETTINGS_GUIDANCE,
} from '../config/locationPermissionContent'


export default function ChallengeList({
  goToDetailView,
}: {
  goToDetailView: (userChallenge: UserChallenge) => void
}) {
  const navigate = useNavigate()
  const { permissionStatus, requestPermission, userLocation } = useLocationPermission()
  const [showPermissionDialog, setShowPermissionDialog] = React.useState(false)
  const [loading, setLoading] = React.useState(true)
  const [error, setError] = React.useState<string | null>(null)
  const [userChallenges, setUserChallenges] = React.useState<UserChallenge[]>([])
  const RADIUS_KM = 5

  const DEFAULT_LOCATION = React.useMemo(
    () => [-36.8485, 174.7633] as [number, number], []
  )

  const statusOrder = {
    accepted: 0,
    in_progress: 1,
    cancelled: 2,
    skipped: 3,
    completed: 4,
    expired: 5,
  }

  const sortedUserChallenges = [...userChallenges].sort((a, b) => {
    return statusOrder[a.status] - statusOrder[b.status]
  })

  const descriptionStyle = {
    margin: '6px 0',
    color: '#555',
    textAlign: 'left',
    fontSize: '14px',
  } as const

  const rowStyle = {
    width: "100%",
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
  } as const

  const isListDisabled = !DEV_SHOW_ALL && permissionStatus !== 'granted'
  const openPermissionDialog = () => setShowPermissionDialog(true)
  const closePermissionDialog = () => setShowPermissionDialog(false)
  const allowPermissionRequest = () => {
    setShowPermissionDialog(false)
    requestPermission()
  }
  const permissionDialog = (
    <LocationPermissionDialog
      open={showPermissionDialog}
      title={LOCATION_PERMISSION_DIALOG_TITLE}
      message={LOCATION_PERMISSION_DIALOG_MESSAGE}
      onAllow={allowPermissionRequest}
      onCancel={closePermissionDialog}
    />
  )

  React.useEffect(() => {
    if (isListDisabled) {
      setUserChallenges([])
      setLoading(false)
      setError(null)
      return
    }
  
    const lat = DEV_SHOW_ALL ? DEFAULT_LOCATION[0] : userLocation?.[0]
    const lng = DEV_SHOW_ALL ? DEFAULT_LOCATION[1] : userLocation?.[1]
    const radius = DEV_SHOW_ALL ? 99999 : RADIUS_KM
  
    if (!DEV_SHOW_ALL && !userLocation) return
  
    setLoading(true)
    getUserChallenges(lat, lng, radius)
      .then((data) => {
        setUserChallenges(data)
        setError(null)
      })
      .catch(() => setError('Could not load challenges.'))
      .finally(() => setLoading(false))
  }, [isListDisabled, userLocation, DEFAULT_LOCATION])

  if (isListDisabled) {
    return (
      <div style={containerStyle}>
        {permissionDialog}
        <h1 style={titleStyle}>Today's Challenges</h1>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <p style={{ color: '#666', marginBottom: '1rem' }}>Location access is required to view challenges.</p>
          <p style={{ fontSize: '0.9rem', color: '#999', marginBottom: '1.5rem' }}>
            {permissionStatus === 'denied'
              ? LOCATION_PERMISSION_SETTINGS_GUIDANCE
              : 'Allow location access to load nearby challenges.'}
          </p>
          <button onClick={openPermissionDialog} style={buttonStyle}>
            Enable Location
          </button>
          <button onClick={() => navigate('/map')} style={{ ...buttonStyle, marginTop: '0.75rem' }}>
            Open Map View
          </button>
        </div>
      </div>
    )
  }

  const handleClose = (id: number) => {
    setUserChallenges((prev) => prev.filter((userChallenge) => userChallenge.id !== id))
  }

  function ChallengeCard({
    userChallenge,
    loading,
    className,
  }: {
    userChallenge?: UserChallenge
    onClose: (id: number) => void
    loading: boolean
    className?: string
  }) {
    if (loading || !userChallenge) {
      return (
        <div
          style={{ ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s' }}
          onMouseEnter={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
          }}
          onMouseLeave={(e) => {
            ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
          }}
        >
          <h2 style={challengeTitleStyle} className="skeleton skeleton-text" />
          <p style={descriptionStyle} className="skeleton skeleton-text small" />
          <div style={rowStyle}>
            <span style={{ ...badgeStyle, background: '#ddd' }} />
            <span style={xpStyle} className="skeleton skeleton-text" />
          </div>
        </div>
      )
    }

    const { challenge } = userChallenge

    return (
      <div
        className={className}
        style={{ ...cardStyle, cursor: 'pointer', transition: 'transform 0.2s'}}
        onClick={() => goToDetailView(userChallenge)}
        onMouseEnter={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)'
        }}
        onMouseLeave={(e) => {
          ;(e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'
        }}
      >
        <h2 style={challengeTitleStyle}>{challenge.name}</h2>
        <p style={descriptionStyle}>{challenge.description ?? 'No description available.'}</p>
        <div style={rowStyle}>
          <span style={{ ...badgeStyle, background: categoryColors[challenge.challenge_category.name] || '#ddd' }}>
            {challenge.challenge_category.name}
          </span>
          <span style={xpStyle}>{challenge.xp_worth} XP</span>
          <span className={`challenge-status challenge-status--${userChallenge.status}`} style={{ ...badgeStyle, background: challengeStatusColors[userChallenge.status] || '#ddd' }}>
            {challengeStatusText[userChallenge.status]}
          </span>
        </div>
      </div>
    )
  }

  return (
    <div style={containerStyle}>
      {permissionDialog}
      <h1 style={titleStyle}>Today's Challenges</h1>
      {error && (
        <p style={{ margin: '0 0 12px', color: '#8a4b00', fontSize: '0.9rem' }}>{error}</p>
      )}
      {permissionStatus !== 'granted' && (
        <div
          style={{
            marginBottom: '12px',
            padding: '10px 12px',
            background: '#f5f7fa',
            border: '1px solid #d9dee7',
            borderRadius: '8px',
          }}
        >
          <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
            {LOCATION_PERMISSION_CHALLENGES_ACCURACY_MESSAGE}
          </p>
          <button onClick={openPermissionDialog} style={{ ...buttonStyle, marginTop: '8px' }}>
            Enable Location
          </button>
        </div>
      )}
      <div className='challenge-list-container'>
        {loading
          ? ['1', '2', '3'].map((i) => (
              <ChallengeCard key={i} onClose={handleClose} loading />
            ))
          : sortedUserChallenges.map((userChallenge) => (
              <ChallengeCard
                key={userChallenge.id}
                userChallenge={userChallenge}
                onClose={handleClose}
                loading={loading}
                className={
                  userChallenge.status === "completed"
                  ? "challenge-card--completed"
                  : ""
                }
              />
            ))}
      </div>
    </div>
  )
}
