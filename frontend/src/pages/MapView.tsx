import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, useMap } from 'react-leaflet'
import type { Challenge } from '../types/challenge'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenges } from '../services/userChallenges'
import { badgeStyle, categoryColors, categoryColorsStrong, xpStyle } from '../styles/challengeStyle'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import LocationPermissionDialog from '../components/LocationPermissionDialog.tsx'
import {
  LOCATION_PERMISSION_BANNER_MESSAGE,
  LOCATION_PERMISSION_DIALOG_MESSAGE,
  LOCATION_PERMISSION_DIALOG_TITLE,
  LOCATION_PERMISSION_SETTINGS_GUIDANCE,
} from '../config/locationPermissionContent'
import L from 'leaflet'

type PermissionStatus = 'not-asked' | 'granted' | 'denied'
const DEFAULT_MAP_CENTER: [number, number] = [-36.8485, 174.7633]
const RADIUS_METRES = 500
const RADIUS_KM = RADIUS_METRES / 1000

function mapPermissionState(state: string): PermissionStatus {
  if (state === 'granted') return 'granted'
  if (state === 'denied') return 'denied'
  return 'not-asked'
}

function createTeardropIcon(challenge_category: Challenge['challenge_category']) {
  return L.divIcon({
    className: 'challenge-marker',
    html: `
      <svg width="36" height="48" viewBox="0 0 24 24">
        <path
          d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"
          fill="${categoryColorsStrong[challenge_category.name]}"
          stroke="white"
          stroke-width="1.6"
        />
        <circle cx="12" cy="9" r="2.3" fill="white" />
      </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  })
}

function RecenterMap({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [center, zoom, map])
  return null
}

export default function MapView() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [challengesError, setChallengesError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not-asked')
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [isInitializingLocation, setIsInitializingLocation] = useState(!DEV_SHOW_ALL) // skip when DEV_SHOW_ALL
  const [locationMessage, setLocationMessage] = useState<string | null>(null)

  const fetchCurrentLocation = (
    options: { showErrors?: boolean; onComplete?: () => void } = {}
  ) => {
    const { showErrors = true, onComplete } = options

    if (!navigator.geolocation) {
      if (showErrors) setLocationMessage('Geolocation is not supported in this browser.')
      onComplete?.()
      return
    }

    setIsRequestingLocation(true)
    if (showErrors) setLocationMessage(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation([latitude, longitude])
        setAccuracy(accuracy)
        setPermissionStatus('granted')
        setIsRequestingLocation(false)
        if (showErrors) setLocationMessage(null)
        onComplete?.()
      },
      (error) => {
        console.error('Error getting location:', error)
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied')
          if (showErrors) setLocationMessage('Location permission is blocked. Enable it in browser/device settings and try again.')
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          if (showErrors) setLocationMessage('Could not determine your location. Please check device location services and try again.')
        } else if (error.code === error.TIMEOUT) {
          if (showErrors) setLocationMessage('Location request timed out. Please try again.')
        } else if (showErrors) {
          setLocationMessage('Could not get location. Please try again.')
        }
        setIsRequestingLocation(false)
        onComplete?.()
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  const requestLocationPermission = () => setShowPermissionDialog(true)
  const handlePermissionDialogAllow = () => { setShowPermissionDialog(false); fetchCurrentLocation() }
  const handlePermissionDialogDeny = () => setShowPermissionDialog(false)

  // Fetch challenges. reruns when location changes
  useEffect(() => {
    let isActive = true

    const lat = DEV_SHOW_ALL ? DEFAULT_MAP_CENTER[0] : userLocation?.[0]
    const lng = DEV_SHOW_ALL ? DEFAULT_MAP_CENTER[1] : userLocation?.[1]
    const radius = DEV_SHOW_ALL ? 99999 : RADIUS_KM

    if (!DEV_SHOW_ALL && !userLocation) return // wait for location unless DEV mode

    getUserChallenges(lat, lng, radius)
      .then((data) => {
        if (isActive) {
          setUserChallenges(data)
          setChallengesError(null)
        }
      })
      .catch(() => {
        if (isActive) setChallengesError('Could not load challenges for the map.')
      })

    return () => { isActive = false }
  }, [userLocation])

  // Location permission check
  useEffect(() => {
  let isActive = true
  console.log('Challenge fetch effect running, DEV_SHOW_ALL:', DEV_SHOW_ALL, 'userLocation:', userLocation)

  const lat = DEV_SHOW_ALL ? DEFAULT_MAP_CENTER[0] : userLocation?.[0]
  const lng = DEV_SHOW_ALL ? DEFAULT_MAP_CENTER[1] : userLocation?.[1]
  const radius = DEV_SHOW_ALL ? 99999 : RADIUS_KM

  if (!DEV_SHOW_ALL && !userLocation) return

  getUserChallenges(lat, lng, radius)
    .then((data) => {
      console.log('Challenges fetched:', data)
      if (isActive) {
        setUserChallenges(data)
        setChallengesError(null)
      }
    })
    .catch((err) => {
      console.error('Challenge fetch error:', err)
      if (isActive) setChallengesError('Could not load challenges for the map.')
    })

  return () => { isActive = false }
}, [userLocation])

  const currUserLocation: [number, number] | null = DEV_SHOW_ALL ? DEFAULT_MAP_CENTER : userLocation
  const mapCenter: [number, number] = currUserLocation ?? DEFAULT_MAP_CENTER
  const locationRequired = !DEV_SHOW_ALL && permissionStatus === 'denied'
  const showChallengesOnMap = DEV_SHOW_ALL || permissionStatus === 'granted'
  const visibleUserChallenges = showChallengesOnMap ? userChallenges : []

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <LocationPermissionDialog
        open={showPermissionDialog}
        title={LOCATION_PERMISSION_DIALOG_TITLE}
        message={LOCATION_PERMISSION_DIALOG_MESSAGE}
        onAllow={handlePermissionDialogAllow}
        onCancel={handlePermissionDialogDeny}
      />

      {locationRequired && (
        <div style={{ backgroundColor: '#fff3cd', borderBottom: '2px solid #ffc107', padding: '1rem', color: '#856404', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <strong>Location access is required</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>{LOCATION_PERMISSION_SETTINGS_GUIDANCE}</p>
          </div>
        </div>
      )}

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {isInitializingLocation && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading your location...</p>
        )}

        {!DEV_SHOW_ALL && permissionStatus !== 'granted' && (
          <div style={{ margin: '12px', padding: '10px 12px', background: '#f5f7fa', border: '1px solid #d9dee7', borderRadius: '8px' }}>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>{LOCATION_PERMISSION_BANNER_MESSAGE}</p>
            {locationMessage && (
              <p style={{ margin: '8px 0 0', color: '#8a4b00', fontSize: '0.85rem' }}>{locationMessage}</p>
            )}
            <button
              onClick={requestLocationPermission}
              disabled={isRequestingLocation}
              style={{ marginTop: '8px', padding: '0.5rem 1rem', backgroundColor: '#4a90e2', color: 'white', border: 'none', borderRadius: '4px', cursor: isRequestingLocation ? 'not-allowed' : 'pointer', opacity: isRequestingLocation ? 0.7 : 1, fontSize: '0.95rem' }}
            >
              {isRequestingLocation ? 'Requesting Location...' : 'Enable Location'}
            </button>
          </div>
        )}

        {locationRequired && !userLocation && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', flexDirection: 'column', gap: '1rem', color: '#666' }}>
            <p>Location access denied.</p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>To enable location in your browser:</p>
            <ul style={{ fontSize: '0.9rem', color: '#999', textAlign: 'left' }}>
              <li>Open browser settings</li>
              <li>Find Privacy/Permissions section</li>
              <li>Allow location for this website</li>
            </ul>
          </div>
        )}

        {challengesError && (
          <p style={{ margin: '12px', color: '#8a4b00', fontSize: '0.9rem' }}>{challengesError}</p>
        )}

        {!locationRequired && !isInitializingLocation && (
          <MapContainer center={mapCenter} zoom={14} style={{ height: '100%', width: '100%' }}>
            <RecenterMap center={mapCenter} zoom={14} />
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
              attribution="Geoapify"
            />
            {currUserLocation && (
              <>
                <CircleMarker center={currUserLocation} radius={8} pathOptions={{ color: 'white', weight: 2, fillColor: 'blue', fillOpacity: 0.8 }}>
                  <Popup>You are here</Popup>
                </CircleMarker>
                <Circle center={currUserLocation} radius={RADIUS_METRES} pathOptions={{ color: '#4a90e2', weight: 2, fillColor: '#4a90e2', fillOpacity: 0.04 }} />
                {accuracy && (
                  <Circle center={currUserLocation} radius={accuracy} pathOptions={{ weight: 0, fillColor: '#73a1d5', fillOpacity: 0.15, dashArray: '4 6' }} />
                )}
              </>
            )}
            {visibleUserChallenges.map((userChallenge) => (
              <Marker
                key={userChallenge.challenge_id}
                position={[Number(userChallenge.challenge.location.latitude), Number(userChallenge.challenge.location.longitude)]}
                icon={createTeardropIcon(userChallenge.challenge.challenge_category)}
              >
                <Popup className="challenge-map-popup">
                  <div className="challenge-map-popup__content">
                    <p className="eyebrow">Nearby Challenge</p>
                    <h3>{userChallenge.challenge.name}</h3>
                    <p>{userChallenge.challenge.description ?? 'No description available.'}</p>
                    <div className="challenge-map-popup__meta">
                      <span style={{ ...badgeStyle, background: categoryColors[userChallenge.challenge.challenge_category.name] || '#ddd', marginRight: 0 }}>
                        {userChallenge.challenge.challenge_category.name}
                      </span>
                      <span style={xpStyle}>+{userChallenge.challenge.xp_worth} XP</span>
                    </div>
                    <Link className="challenge-map-popup__link" to={`/challenges/${userChallenge.id}`}>
                      Open Full Detail
                    </Link>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>
    </div>
  )
}