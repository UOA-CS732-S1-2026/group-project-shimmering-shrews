import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { DEV_SHOW_ALL } from '../config/featureFlags'
import { LOCATION_PERMISSION_CHECKIN_MESSAGE } from '../config/locationPermissionContent'
import { useLocationPermission } from '../hooks/useLocationPermission'
import {
  acceptUserChallenge,
  cancelUserChallenge,
  checkInUserChallenge,
} from '../services/userChallenges'
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
import { ArrowLeft, Check, MapPinned, X } from 'lucide-react'
import LevelUpNotification from '../components/LevelUpNotification'

const ALLOWED_COMPLETION_RADIUS_METERS = 700


function getDistanceMetres(a: [number, number], b: [number, number]) {
  const earthRadiusMetres = 6371000
  const lat1 = (a[0] * Math.PI) / 180
  const lat2 = (b[0] * Math.PI) / 180
  const dLat = ((b[0] - a[0]) * Math.PI) / 180
  const dLon = ((b[1] - a[1]) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2)

  return earthRadiusMetres * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h))
}

export default function ChallengeDetailView({
  userChallenge,
  goToChallengeList,
}: {
  goToChallengeList: () => void
  userChallenge: UserChallenge | null
}) {
  const navigate = useNavigate()
  const { permissionStatus } = useLocationPermission()
  const [activeUserChallenge, setActiveUserChallenge] = useState<UserChallenge | null>(userChallenge)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [actionError, setActionError] = useState<string | null>(null)
  const [levelUpNotification, setLevelUpNotification] = useState<{
    type: string
    xpGained: number
    previousXp: number
    newXp: number
    previousLevelXpRequired: number
    nextLevelXpRequired: number
    levelUp: boolean
    previousLevel: number
    newLevel: number
    xpForLevelStart: number
    xpForNextLevelStart: number
    message: string
  } | null>(null)

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
    color: 'white',
    border: 'none',
    cursor: 'pointer',
    alignSelf: 'flex-end',
    width: '100%',
    fontWeight: 'bold',
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

  const handleActionError = (error: unknown, fallbackMessage: string) => {
    setActionError(error instanceof Error ? error.message : fallbackMessage)
  }

  const checkIn = () => {
    if (isCheckInDisabled) return

    if (!navigator.geolocation) {
      setActionError('Geolocation is not supported by your browser.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords
        const distance = getDistanceMetres(
          [latitude, longitude],
          [Number(challenge.location.latitude), Number(challenge.location.longitude)]
        )

        if (distance > ALLOWED_COMPLETION_RADIUS_METERS) {
          setActionError(
            `You are too far away (${Math.round(distance)}m). You must be within ${ALLOWED_COMPLETION_RADIUS_METERS}m of the challenge.`
          )
          setIsSubmitting(false)
          return
        }

        try {
          const updated = await checkInUserChallenge(activeUserChallenge.id, latitude, longitude)
          setActiveUserChallenge(updated.userChallenge)
          setLevelUpNotification(updated.notification)
        } catch (error) {
          handleActionError(error, 'Failed to check into challenge. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      },
      () => {
        setActionError('Unable to retrieve your location. Please enable location services.')
        setIsSubmitting(false)
      }
    )
  }

  const acceptChallenge = () => {
    if (!canAccept || isSubmitting) return

    if (!navigator.geolocation) {
      setActionError('Geolocation is not supported by your browser.')
      return
    }

    setIsSubmitting(true)
    setActionError(null)

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords
          const accepted = await acceptUserChallenge(activeUserChallenge.id, latitude, longitude)
          setActiveUserChallenge(accepted)
        } catch (error) {
          handleActionError(error, 'Failed to accept challenge. Please try again.')
        } finally {
          setIsSubmitting(false)
        }
      },
      () => {
        setActionError('Unable to retrieve your location. Please enable location services.')
        setIsSubmitting(false)
      }
    )
  }

  const cancelChallenge = async () => {
    if (!canCancel || isSubmitting) return

    setIsSubmitting(true)
    setActionError(null)

    try {
      const cancelled = await cancelUserChallenge(activeUserChallenge.id)
      setActiveUserChallenge(cancelled)
    } catch (error) {
      handleActionError(error, 'Failed to cancel challenge. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const openRoute = () => {
    navigate(`/map?focusUserChallengeId=${activeUserChallenge.id}&returnTo=/challenges/${activeUserChallenge.id}`, {
      state: { userChallenge: activeUserChallenge }
    })
  }

  const checkInLabel = isSubmitting
    ? 'Working...'
    : isCompleted
      ? 'Completed'
      : isExpired
        ? 'Expired'
        : isCancelled
          ? 'Cancelled'
          : isLocationBlocked
            ? 'Location Required'
            : 'Check In'

  return (
    <div>
      {levelUpNotification && (
        <LevelUpNotification
          xpGained={levelUpNotification.xpGained}
          previousXp={levelUpNotification.previousXp}
          newXp={levelUpNotification.newXp}
          previousLevelXpRequired={levelUpNotification.previousLevelXpRequired}
          nextLevelXpRequired={levelUpNotification.nextLevelXpRequired}
          levelUp={levelUpNotification.levelUp}
          previousLevel={levelUpNotification.previousLevel}
          newLevel={levelUpNotification.newLevel}
          xpForLevelStart={levelUpNotification.xpForLevelStart}
          xpForNextLevelStart={levelUpNotification.xpForNextLevelStart}
          message={levelUpNotification.message}
          onClose={() => setLevelUpNotification(null)}
        />
      )}
    
    <div style={containerStyle}>
      <h1 style={titleStyle}>Challenge Details</h1>
      <div
        style={{
          ...cardStyle,
          display: 'flex',
          flexDirection: 'column',
          padding: '20px',
          maxWidth: '500px',
          margin: '0 auto',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <h2 style={{ ...challengeTitleStyle, fontSize: '1.3rem', marginBottom: '5px' }}>{challenge.name}</h2>
          <p style={{ margin: '10px 0', fontWeight:'bold', color: '#344b52', fontSize: '1.0rem' }}>Location: {challenge.location.name}</p>
          <hr />
          <p style={detailDescriptionStyle}>{challenge.description ?? 'No description available.'}</p>
          <hr />
        </div>
         <div
            style={{
              display: 'flex',
              gap: '10px',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
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

        <div>
          <div style={{ display: 'flex', marginTop: '60px', gap: '10px', flexWrap: 'wrap', justifyContent: 'flex-start' }}>
            {canAccept && (
              <button
                onClick={acceptChallenge}
                disabled={isSubmitting}
                style={{
                  ...checkInButtonStyle,
                  margin: 0,
                  background: isSubmitting ? '#86a3c8' : '#1463c7',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Working...' : 'Accept'}
              </button>
            )}

            {isAccepted && (
              <button
                onClick={openRoute}
                disabled={isSubmitting}
                style={{
                  ...checkInButtonStyle,
                  margin: 0,
                  background: '#7a52cc',
                  fontWeight: 'bold',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                View Route
                <span
                  style={{
                    position: 'absolute',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <MapPinned />
                </span>
              </button>
            )}

            {canCancel && (
              <button
                onClick={cancelChallenge}
                disabled={isSubmitting}
                style={{
                  ...checkInButtonStyle,
                  margin: 0,
                  background: '#d21f3a',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                  position: 'relative',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 'bold',
                }}
              >
                Cancel Challenge
                <span
                  style={{
                    position: 'absolute',
                    right: '16px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >

                  <X />
                </span>
              </button>
            )}
          </div>

          <button
            onClick={checkIn}
            disabled={isCheckInDisabled}
            title={isLocationBlocked ? 'Location access required to check in' : ''}
            style={{
              ...checkInButtonStyle,
              marginTop: '10px',
              background: isCompleted || isCancelled || isExpired || isCheckInDisabled ? 'gray' : isLocationBlocked ? '#ccc' : '#3ecf4f',
              cursor: isCheckInDisabled ? 'not-allowed' : 'pointer',
              opacity: isCheckInDisabled ? 0.6 : 1,
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {checkInLabel}
            <span
              style={{
                
                position: 'absolute',
                right: '16px',
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <Check />
            </span>
          </button>

          {isAccepted && (
            <p style={{ fontSize: '0.9rem', color: '#5c4799', marginTop: '0.5rem', marginBottom: 0 }}>
              You are on the way. Use View Route, then return here to check in.
            </p>
          )}
          {!isAccepted && !isCompleted && !isCancelled && !isExpired && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem', marginBottom: 0 }}>
              Accept this challenge first to enable check in.
            </p>
          )}
          {isExpired && (
            <p style={{ fontSize: '0.9rem', color: '#555', marginTop: '0.5rem', marginBottom: 0 }}>
              This challenge expired at the end of its assigned day.
            </p>
          )}
          {isLocationBlocked && (
            <p style={{ fontSize: '0.9rem', color: '#999', marginTop: '0.5rem', marginBottom: 0 }}>
              {LOCATION_PERMISSION_CHECKIN_MESSAGE}
            </p>
          )}
          {actionError ? <p style={{ color: '#b00020', marginTop: '10px' }}>{actionError}</p> : null}
        </div>
      </div>

      <button onClick={goToChallengeList} style={buttonStyle}>
        <span
          style={{
            position: 'absolute',
            left: '16px',
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <ArrowLeft />
        </span>
        Return to list 
      </button>
    </div>
  </div>
  )
}
