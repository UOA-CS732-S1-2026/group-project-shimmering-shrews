import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle, CircleMarker } from 'react-leaflet'
import { getChallenges } from '../services/challenges'
import type { Challenge } from '../types/challenge'
import { badgeStyle, categoryColors, categoryColorsStrong, xpStyle } from '../styles/challengeStyle'

import L from "leaflet";

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
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const radius = 500 // metres

  useEffect(() => {
    getChallenges().then((data) => {
      setChallenges(data)
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


  const nearbyChallenges = currUserLocation
    ? challenges.filter((challenge) =>
        DEV_SHOW_ALL ||
        getDistanceMetres(currUserLocation, [
          Number(challenge.location.latitude),
          Number(challenge.location.longitude),
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
          {nearbyChallenges.map((challenge) => (
            <Marker
              key={challenge.id}
              position={[Number(challenge.location.latitude), Number(challenge.location.longitude)]}
              icon={createTeardropIcon(challenge.challenge_category)}
            >
              <Popup className="challenge-map-popup">
                <div className="challenge-map-popup__content">
                  <p className="eyebrow">Nearby Challenge</p>
                  <h3>{challenge.name}</h3>
                  <p>{challenge.description ?? 'No description available.'}</p>
                  <div className="challenge-map-popup__meta">
                    <span
                      style={{
                        ...badgeStyle,
                        background: categoryColors[challenge.challenge_category.name] || '#ddd',
                        marginRight: 0,
                      }}
                    >
                      {challenge.challenge_category.name}
                    </span>
                    <span style={xpStyle}>+{challenge.xp_worth} XP</span>
                  </div>
                  <Link className="challenge-map-popup__link" to={`/challenges/${challenge.id}`}>
                    Open Full Detail
                  </Link>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      )}
    </div>
  )
}