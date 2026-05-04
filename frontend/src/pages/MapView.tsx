import { useState, useEffect, useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker, Polyline, useMap } from 'react-leaflet'
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster"

import type { Challenge } from '../types/challenge'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenge, getUserChallenges } from '../services/userChallenges'
import { getRoute } from '../services/routingService'
import { badgeStyle, categoryColors, categoryColorsStrong, xpStyle } from '../styles/challengeStyle'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import LocationPermissionDialog from '../components/LocationPermissionDialog.tsx'
import {
  LOCATION_PERMISSION_BANNER_MESSAGE,
  LOCATION_PERMISSION_DIALOG_MESSAGE,
  LOCATION_PERMISSION_DIALOG_TITLE,
  LOCATION_PERMISSION_SETTINGS_GUIDANCE,
} from '../config/locationPermissionContent'

type PermissionStatus = 'not-asked' | 'granted' | 'denied'
const DEFAULT_MAP_CENTER: [number, number] = [-36.8485, 174.7633]

function mapPermissionState(state: string): PermissionStatus {
  if (state === 'granted') {
    return 'granted'
  }
  if (state === 'denied') {
    return 'denied'
  }
  return 'not-asked'
}

function createTeardropIcon(challenge_category : Challenge["challenge_category"]) {
  const teardrop = L.divIcon({
    className: "challenge-marker",
    html: `
      <svg width="36" height="48" viewBox="0 0 24 24">
        <!-- outer teardrop -->
        <path
          d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"
          fill="${categoryColorsStrong[challenge_category.name]}"
          stroke="white"
          stroke-width="1.6"
        />

        <!-- inner circle -->
        <circle
          cx="12"
          cy="9"
          r="2.3"
          fill="white"
        />
      </svg>
    `,
    iconSize: [24, 24],
    iconAnchor: [12, 24],
  });

  return teardrop
}

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

function toLatLng(
  lat: number | string | null | undefined,
  lng: number | string | null | undefined
): [number, number] | null {
  if (
    lat == null ||
    lng == null ||
    lat === '' ||
    lng === ''
  ) {
    return null
  }

  const parsedLat = Number(lat)
  const parsedLng = Number(lng)

  if (!Number.isFinite(parsedLat) || !Number.isFinite(parsedLng)) {
    return null
  }

  return [parsedLat, parsedLng]
}

function RecenterMap({
  center,
  zoom,
  focusPoints,
}: {
  center: [number, number]
  zoom: number
  focusPoints?: [number, number][] | null
}) {
  const map = useMap()

  useEffect(() => {
    if (focusPoints && focusPoints.length > 0) {
      if (focusPoints.length === 1) {
        map.setView(focusPoints[0], Math.max(zoom, 16))
        return
      }

      map.fitBounds(L.latLngBounds(focusPoints), {
        padding: [48, 48],
        maxZoom: 16,
      })
      return
    }

    map.setView(center, zoom)
  }, [center, zoom, focusPoints, map])

  return null
}

export default function MapView() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  // how accurate our GPS reports itself to be 
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const [challengesError, setChallengesError] = useState<string | null>(null)
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not-asked')
  const [showPermissionDialog, setShowPermissionDialog] = useState(false)
  const [isRequestingLocation, setIsRequestingLocation] = useState(false)
  const [isInitializingLocation, setIsInitializingLocation] = useState(true)
  const [locationMessage, setLocationMessage] = useState<string | null>(null)
  const [focusedRouteChallenge, setFocusedRouteChallenge] = useState<UserChallenge | null>(null)
  const [route, setRoute] = useState<[number, number][] | null>(null)
  const [routeError, setRouteError] = useState<string | null>(null)
  const radius = 500 // metres
  const focusedUserChallengeId = Number(searchParams.get('focusUserChallengeId') || 0)
  const returnTo = searchParams.get('returnTo') || '/challenges'

  const fetchCurrentLocation = (
    options: { showErrors?: boolean; onComplete?: () => void } = {}
  ) => {
    const { showErrors = true, onComplete } = options

    if (!navigator.geolocation) {
      if (showErrors) {
        setLocationMessage('Geolocation is not supported in this browser.')
      }
      onComplete?.()
      return
    }

    setIsRequestingLocation(true)
    if (showErrors) {
      setLocationMessage(null)
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation([latitude, longitude])
        setAccuracy(accuracy)
        setPermissionStatus('granted')
        setIsRequestingLocation(false)
        if (showErrors) {
          setLocationMessage(null)
        }
        onComplete?.()
      },
      (error) => {
        console.error("Error getting location:", error)
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied')
          if (showErrors) {
            setLocationMessage('Location permission is blocked. Enable it in browser/device settings and try again.')
          }
        } else if (error.code === error.POSITION_UNAVAILABLE) {
          if (showErrors) {
            setLocationMessage('Could not determine your location. Please check device location services and try again.')
          }
        } else if (error.code === error.TIMEOUT) {
          if (showErrors) {
            setLocationMessage('Location request timed out. Please try again.')
          }
        } else {
          if (showErrors) {
            setLocationMessage('Could not get location. Please try again.')
          }
        }
        setIsRequestingLocation(false)
        onComplete?.()
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    )
  }

  // Request location permission via dialog first, then geolocation
  const requestLocationPermission = () => {
    setShowPermissionDialog(true)
  }

  const handlePermissionDialogAllow = () => {
    setShowPermissionDialog(false)
    fetchCurrentLocation()
  }

  const handlePermissionDialogDeny = () => {
    setShowPermissionDialog(false)
  }

  useEffect(() => {
    let isActive = true

    getUserChallenges().then((data) => {
      if (isActive) {
        setUserChallenges(data)
        setChallengesError(null)
      }
    }).catch(() => {
      if (isActive) {
        setChallengesError('Could not load challenges for the map.')
      }
    })

    const runPermissionCheck = async () => {
      if (!navigator.permissions) {
        console.warn('Permissions API not available')
        if (isActive) {
          setIsInitializingLocation(false)
        }
        return
      }

      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        const mappedState = mapPermissionState(result.state)

        if (!isActive) {
          return
        }

        setPermissionStatus(mappedState)
        if (mappedState === 'granted') {
          fetchCurrentLocation({ showErrors: false, onComplete: () => setIsInitializingLocation(false) })
        } else {
          setIsInitializingLocation(false)
        }

        result.onchange = () => {
          if (!isActive) {
            return
          }
          const changedState = mapPermissionState(result.state)
          setPermissionStatus(changedState)
          if (changedState === 'granted') {
            fetchCurrentLocation()
          }
        }
      } catch (err) {
        console.warn('Could not query permission state:', err)
        if (isActive) {
          setIsInitializingLocation(false)
        }
      }
    }

    void runPermissionCheck()

    return () => {
      isActive = false
    }
  }, [])

  const focusedUserChallenge = useMemo(
    () => userChallenges.find((challenge) => challenge.id === focusedUserChallengeId),
    [focusedUserChallengeId, userChallenges]
  )

  useEffect(() => {
    let isActive = true

    if (!focusedUserChallengeId) {
      setFocusedRouteChallenge(null)
      return () => {
        isActive = false
      }
    }

    getUserChallenge(String(focusedUserChallengeId))
      .then((challenge) => {
        if (!isActive) {
          return
        }

        setFocusedRouteChallenge(challenge)
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        console.error('Could not load focused challenge route details', error)
        setFocusedRouteChallenge(null)
      })

    return () => {
      isActive = false
    }
  }, [focusedUserChallengeId])

  const activeFocusedChallenge = focusedRouteChallenge ?? focusedUserChallenge

  // values for location, either device gps or hardcoded for dev purposes
  // comment out the one you don't want to use. Insert whatever hardcoded values you wish

  // hardcoded location
  // const currUserLocation: [number, number] | null = [-36.8485, 174.7633]

  // gps location
  const currUserLocation: [number, number] | null = userLocation
  const mapCenter: [number, number] = currUserLocation ?? DEFAULT_MAP_CENTER

  const acceptedRouteStart = useMemo(() => {
    if (!activeFocusedChallenge) {
      return null
    }

    return toLatLng(
      activeFocusedChallenge.accepted_from_lat,
      activeFocusedChallenge.accepted_from_lng
    )
  }, [activeFocusedChallenge])

  const focusedRouteStart = acceptedRouteStart ?? currUserLocation

  const focusedChallengeLocation = useMemo(() => {
    if (!activeFocusedChallenge) {
      return null
    }

    return toLatLng(
      activeFocusedChallenge.challenge.location.latitude,
      activeFocusedChallenge.challenge.location.longitude
    )
  }, [activeFocusedChallenge])

  useEffect(() => {
    let isActive = true
    setRoute(null)
    setRouteError(null)

    if (
      !activeFocusedChallenge ||
      activeFocusedChallenge.status !== 'accepted' ||
      !focusedRouteStart ||
      !focusedChallengeLocation
    ) {
      if (activeFocusedChallenge?.status === 'accepted' && !focusedRouteStart) {
        setRouteError('Could not determine the route start location for this challenge.')
      }

      return () => {
        isActive = false
      }
    }

    getRoute(focusedRouteStart, focusedChallengeLocation, 'walk')
      .then((points) => {
        if (!isActive) {
          return
        }

        if (points.length > 0) {
          setRoute(points)
          return
        }

        setRoute(null)
        setRouteError('Could not load a route to this challenge right now.')
      })
      .catch((error) => {
        if (!isActive) {
          return
        }

        console.error('Failed to load route for focused challenge', error)
        setRoute(null)
        setRouteError('Could not load a route to this challenge right now.')
      })

    return () => {
      isActive = false
    }
  }, [activeFocusedChallenge, focusedChallengeLocation, focusedRouteStart])

  const mapFocusPoints = useMemo(() => {
    if (route) {
      return route
    }

    if (focusedRouteStart && focusedChallengeLocation) {
      return [focusedRouteStart, focusedChallengeLocation]
    }

    if (focusedChallengeLocation) {
      return [focusedChallengeLocation]
    }

    return null
  }, [focusedChallengeLocation, focusedRouteStart, route])

  // Determine if we should show location-required state
  const locationRequired = !DEV_SHOW_ALL && permissionStatus === 'denied'
  const showChallengesOnMap = DEV_SHOW_ALL || permissionStatus === 'granted'

  const visibleChallenges = showChallengesOnMap
    ? userChallenges.filter((uc) =>
        DEV_SHOW_ALL || !currUserLocation ||
        getDistanceMetres(currUserLocation, [
          Number(uc.challenge.location.latitude),
          Number(uc.challenge.location.longitude),
        ]) <= radius
      )
    : []

  const challengesForMap = useMemo(() => {
    if (activeFocusedChallenge) {
      return [activeFocusedChallenge]
    }
    return visibleChallenges
  }, [activeFocusedChallenge, visibleChallenges])

  return (
    <div style={{ height: '100vh', width: '100%', display: 'flex', flexDirection: 'column' }}>
      <LocationPermissionDialog
        open={showPermissionDialog}
        title={LOCATION_PERMISSION_DIALOG_TITLE}
        message={LOCATION_PERMISSION_DIALOG_MESSAGE}
        onAllow={handlePermissionDialogAllow}
        onCancel={handlePermissionDialogDeny}
      />

      {/* Location Denied Banner */}
      {locationRequired && (
        <div style={{
          backgroundColor: '#fff3cd',
          borderBottom: '2px solid #ffc107',
          padding: '1rem',
          color: '#856404',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center'
        }}>
          <div>
            <strong>Location access is required</strong>
            <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.9rem' }}>
              {LOCATION_PERMISSION_SETTINGS_GUIDANCE}
            </p>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {activeFocusedChallenge && (
          <div className="map-focus-banner">
            <div>
              <strong>{activeFocusedChallenge.challenge.name}</strong>
              <p>
                Follow the line to the challenge, then return to challenge detail to check in.
              </p>
              {routeError && (
                <span style={{ display: 'block', marginTop: '0.35rem', color: '#8a4b00', fontSize: '0.9rem' }}>
                  {routeError}
                </span>
              )}
            </div>
            <button
              className="map-focus-banner__button"
              onClick={() => navigate(returnTo)}
            >
              Return To Check In
            </button>
          </div>
        )}

        {isInitializingLocation && (
          <p style={{ textAlign: 'center', marginTop: '2rem' }}>Loading your location...</p>
        )}

        {permissionStatus !== 'granted' && (
          <div style={{
            margin: '12px',
            padding: '10px 12px',
            background: '#f5f7fa',
            border: '1px solid #d9dee7',
            borderRadius: '8px',
          }}>
            <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
              {LOCATION_PERMISSION_BANNER_MESSAGE}
            </p>
            {locationMessage && (
              <p style={{ margin: '8px 0 0', color: '#8a4b00', fontSize: '0.85rem' }}>
                {locationMessage}
              </p>
            )}
            <button
              onClick={requestLocationPermission}
              disabled={isRequestingLocation}
              style={{
                marginTop: '8px',
                padding: '0.5rem 1rem',
                backgroundColor: '#4a90e2',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: isRequestingLocation ? 'not-allowed' : 'pointer',
                opacity: isRequestingLocation ? 0.7 : 1,
                fontSize: '0.95rem'
              }}
            >
              {isRequestingLocation ? 'Requesting Location...' : 'Enable Location'}
            </button>
          </div>
        )}

        {/* Location Denied - DEV_SHOW_ALL is false */}
        {locationRequired && !userLocation && (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100%',
            flexDirection: 'column',
            gap: '1rem',
            color: '#666'
          }}>
            <p>Location access denied.</p>
            <p style={{ fontSize: '0.9rem', color: '#999' }}>
              To enable location in your browser:
            </p>
            <ul style={{ fontSize: '0.9rem', color: '#999', textAlign: 'left' }}>
              <li>Open browser settings</li>
              <li>Find Privacy/Permissions section</li>
              <li>Allow location for this website</li>
            </ul>
          </div>
        )}

        {challengesError && (
          <p style={{ margin: '12px', color: '#8a4b00', fontSize: '0.9rem' }}>
            {challengesError}
          </p>
        )}

        {!locationRequired && !isInitializingLocation && (
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ height: '100%', width: '100%' }}
          >
            <RecenterMap center={mapCenter} zoom={14} focusPoints={mapFocusPoints} />
            <TileLayer
              url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
              attribution="Geoapify"
            />
            {currUserLocation && (
              <>
                <CircleMarker
                  center={currUserLocation}
                  radius={8}
                  pathOptions={{
                    color: "white",
                    weight: 2,
                    fillColor: "blue",
                    fillOpacity: 0.8
                  }}
                >
                  <Popup>You are here</Popup>
                </CircleMarker>
                <Circle
                  center={currUserLocation}
                  radius={radius}
                  pathOptions={{
                    color: '#4a90e2',
                    weight: 2,
                    fillColor: '#4a90e2',
                    fillOpacity: 0.04,
                  }}
                />
                {accuracy && (
                  <Circle
                    center={currUserLocation}
                    radius={accuracy}
                    pathOptions={{
                      weight: 0,
                      fillColor: '#73a1d5',
                      fillOpacity: 0.15,
                      dashArray: '4 6'
                    }}
                  />
                )}
              </>
            )}
            <MarkerClusterGroup
            maxClusterRadius={10}
            spiderfyOnMaxZoom={true}
            showCoverageOnHover={true}
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            iconCreateFunction={(cluster : any) => {
            const count = cluster.getChildCount()

            return L.divIcon({
              html: `
                <div style="
                  position: relative;
                  width: 44px;
                  height: 48px;
                ">

                  <!-- backmost pin (behind front pin) -->
                  <svg style="
                    position: absolute;
                    left: 6px;
                    top: 0px;
                    opacity: 0.9;
                  " width="36" height="48" viewBox="0 0 24 24">
                    <path
                      d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"
                      fill="#7ed321"
                      stroke="white"
                      stroke-width="1.6"
                    />
                    <circle cx="12" cy="9" r="2.3" fill="white" />
                  </svg>

                  <!-- Frontmost pin -->
                  <svg style="
                    position: absolute;
                    left: 0px;
                    top: 0px;
                  " width="36" height="48" viewBox="0 0 24 24">
                    <path
                      d="M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z"
                      fill="#4a90e2"
                      stroke="white"
                      stroke-width="1.6"
                    />
                  </svg>

                  <!-- Display number of challenges in cluster -->
                  <div style="
                    position: absolute;
                    left: 0;
                    top: 11px;
                    width: 36px;
                    text-align: center;
                    font-size: 10px;
                    font-weight: bold;
                    color: #ffffff;
                    pointer-events: none;
                    z-index: 10000;
                  ">
                    ${count}
                  </div>

                </div>
              `,
              iconSize: [44, 48],
              className: "custom-cluster",
            })
            }}>
            {challengesForMap.map((uc) => (
              <Marker
                key={uc.id}
                position={[Number(uc.challenge.location.latitude), Number(uc.challenge.location.longitude)]}
                icon={createTeardropIcon(uc.challenge.challenge_category)}
              >
                <Popup className="challenge-map-popup">
                  <div className="challenge-map-popup__content">
                    <p className="eyebrow">Nearby Challenge</p>
                    <h3>{uc.challenge.name}</h3>
                    <p>{uc.challenge.description ?? 'No description available.'}</p>
                    <div className="challenge-map-popup__meta">
                      <span
                        style={{
                          ...badgeStyle,
                          background: categoryColors[uc.challenge.challenge_category.name] || '#ddd',
                          marginRight: 0,
                        }}
                      >
                        {uc.challenge.challenge_category.name}
                      </span>
                      <span style={xpStyle}>+{uc.challenge.xp_worth} XP</span>
                    </div>
                    {!activeFocusedChallenge && (
                      <Link className="challenge-map-popup__link" to={`/challenges/${uc.id}`}>
                        Open Full Detail
                      </Link>
                    )}
                  </div>
                </Popup>
              </Marker>
            ))}
            </MarkerClusterGroup>

            {route && (
              <Polyline
                positions={route}
                pathOptions={{
                  color: '#1463c7',
                  weight: 4,
                  opacity: 0.85,
                }}
              />
            )}

          </MapContainer>
        )}
      </div>
    </div>
  )
}
