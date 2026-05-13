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
import { ArrowLeft, Check, MapPinned, X, MapPin } from 'lucide-react'
import LevelUpNotification from '../components/LevelUpNotification'
import BadgeNotification from '../components/BadgeNotification'
import type { BadgeAwardedNotification, LevelUpNotificationData } from '../services/userChallenges'

// Must match ALLOWED_COMPLETION_RADIUS_METERS in the backend constants
const ALLOWED_COMPLETION_RADIUS_METERS = 700

// Calculates the distance in metres between two GPS coordinates using the Haversine formula.
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

// Displays the full details of a user challenge including status, location, XP and action buttons.
// Handles accepting, cancelling, and checking in to a challenge.
// Shows level up and badge notifications after a successful check-in.
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
  const [levelUpNotification, setLevelUpNotification] = useState<
  LevelUpNotificationData | null>(null)
  const [badgeNotification, setBadgeNotification] = useState<
  BadgeAwardedNotification[] | null>(null)

  // Sync local state when the parent passes a new challenge
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

  // Extracts a user-friendly error message from an unknown error type
  const handleActionError = (error: unknown, fallbackMessage: string) => {
    setActionError(error instanceof Error ? error.message : fallbackMessage)
  }

  // Verifies the user's proximity to the challenge location and submits a check-in request.
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
        // Reject check-in if user is outside the allowed radius
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
          setLevelUpNotification(updated.notification?.level ?? null)

          // Show badge notification if any badges were awarded during this check-in
          if (updated.notification && updated.notification.badgesAwarded && updated.notification.badgesAwarded.length > 0) {
            setBadgeNotification(updated.notification!.badgesAwarded)
          }
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

  // Records the user's location and marks the challenge as accepted.
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

  // Marks the challenge as cancelled.
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

  // Navigates to the map view focused on this challenge's route
  const openRoute = () => {
    navigate(`/map?focusUserChallengeId=${activeUserChallenge.id}&returnTo=/challenges/${activeUserChallenge.id}`, {
      state: { userChallenge: activeUserChallenge }
    })
  }

  // Determines the check-in button label based on the current challenge status
  const checkInLabel = isSubmitting
    ? 'Check In'
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
      {/* Show level up notification after a successful check-in */}
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
      {/* Show badge notification after level up notification has closed */}
      {!levelUpNotification && badgeNotification && (
        <BadgeNotification
          badges={badgeNotification}
          onClose={() => setBadgeNotification(null)}
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
          <h2 style={{ ...challengeTitleStyle, fontSize: '1.3rem', marginBottom: '5px' }}>
            <img src={challenge.challenge_category.icon || '/default-icon.png'} alt="Category Icon" style={{ height: '24px'}}/>
            {challenge.name}
          </h2>
          <p style={{ margin: '10px 0', fontWeight:'bold', color: '#344b52', fontSize: '1.0rem' }}>
            <MapPin style={{ marginRight: '3px', height: '18px' }} />
            Location: {challenge.location.name}
          </p>
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
                  background: isSubmitting ? '#86a3c8' : '#287eee',
                  cursor: isSubmitting ? 'not-allowed' : 'pointer',
                  opacity: isSubmitting ? 0.6 : 1,
                }}
              >
                {isSubmitting ? 'Accepting...' : 'Accept'}
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
