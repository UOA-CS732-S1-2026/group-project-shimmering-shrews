import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from 'react-leaflet'
import L from "leaflet";
import MarkerClusterGroup from "react-leaflet-cluster"

import type { Challenge } from '../types/challenge'
import type { UserChallenge } from '../types/userChallenge'
import { getUserChallenges } from '../services/userChallenges'
import { badgeStyle, categoryColors, categoryColorsStrong, xpStyle } from '../styles/challengeStyle'

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

export default function MapView() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  // how accurate our GPS reports itself to be 
  const [accuracy, setAccuracy] = useState<number | null>(null)
  const [userChallenges, setUserChallenges] = useState<UserChallenge[]>([])
  const radius = 500 // metres

  useEffect(() => {
    getUserChallenges().then((data) => {
      setUserChallenges(data)
    })
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords
        setUserLocation([latitude, longitude])
        setAccuracy(accuracy)
      },
      (error) => {
        console.error("Error getting location:", error);
      },
      {
        enableHighAccuracy: true, // get precise location, not approximation
        timeout: 10000,           // max time to wait (in ms)
        maximumAge: 0             // use current location, not cached
      }
    )
  }, [])


  // values for location, either device gps or hardcoded for dev purposes
  // comment out the one you don't want to use. Insert whatever hardcoded values you wish

  // hardcoded location
  // const currUserLocation: [number, number] | null = [-36.8485, 174.7633]

  // gps location
  const currUserLocation: [number, number] | null = userLocation

  // showing all or radius bound challenges on map, for devevlopment pruposes
  // true for all, false for radius bound
  const DEV_SHOW_ALL = true

  console.log(userChallenges);

  const nearbyChallenges = currUserLocation
    ? userChallenges.filter((uc) =>
        DEV_SHOW_ALL ||
        getDistanceMetres(currUserLocation, [
          Number(uc.challenge.location.latitude),
          Number(uc.challenge.location.longitude),
        ]) <= radius
      )
    : []

  return (
    <div style={{ height: '100vh', width: '100%' }}>
      {!currUserLocation ? (
        <p style={{ textAlign: 'center', marginTop: '2rem' }}>Grabbing your location...</p>
      ) : (
        <MapContainer
          center={currUserLocation}
          zoom={14}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
            attribution="Geoapify"
          />
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
          {/* Accuracy radius of how precise the user's location is */}
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
          {nearbyChallenges.map((uc) => (
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
                  <Link className="challenge-map-popup__link" to={`/challenges/${uc.id}`}>
                    Open Full Detail
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
          </MarkerClusterGroup>
        </MapContainer>
      )}
    </div>
  )
}