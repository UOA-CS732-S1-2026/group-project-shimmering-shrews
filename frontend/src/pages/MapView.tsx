import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import { getChallenges } from '../services/challenges'
import type { Challenge } from '../types/challenge'
import { badgeStyle, categoryColors, xpStyle } from '../styles/challengeStyle'

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
  const [challenges, setChallenges] = useState<Challenge[]>([])
  const radius = 500 // metres

  useEffect(() => {
    getChallenges().then((data) => {
      setChallenges(data)
    })
    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      setUserLocation([latitude, longitude])
    })
  }, [])


  // values for location, either device gps or hardcoded for dev purposes
  // comment out the one you don't want to use. Insert whatever hardcoded values you wish

  // hardcoded location
  const currUserLocation: [number, number] | null = [-36.8485, 174.7633]

  // gps location
  // const currUserLocation: [number, number] | null = userLocation

  // showing all or radius bound challenges on map, for devevlopment pruposes
  // true for all, false for radius bound
  const DEV_SHOW_ALL = false


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
          <Marker position={currUserLocation}>
            <Popup>You are here</Popup>
          </Marker>
          <Circle
            center={currUserLocation}
            radius={radius}
            pathOptions={{
              color: '#4a90e2',
              fillColor: '#4a90e2',
              fillOpacity: 0.1,
            }}
          />
          {nearbyChallenges.map((challenge) => (
            <Marker
              key={challenge.id}
              position={[Number(challenge.location.latitude), Number(challenge.location.longitude)]}
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