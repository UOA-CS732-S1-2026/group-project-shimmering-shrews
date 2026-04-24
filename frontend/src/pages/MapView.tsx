import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet'
import { getChallenges } from '../services/challenges'
import type { Challenge } from '../types/challenge'
import { badgeStyle, categoryColors, xpStyle } from '../styles/challengeStyle'

export default function MapView() {
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)
  const [challenges, setChallenges] = useState<Challenge[]>([])

  useEffect(() => {
    getChallenges().then((data) => {
      setChallenges(data)
    })

    navigator.geolocation.getCurrentPosition((position) => {
      const { latitude, longitude } = position.coords
      setUserLocation([latitude, longitude])
    })
  }, [])

  return (
  <div style={{ height: '100vh', width: '100%' }}>
    {!userLocation ? (
      <p style={{ textAlign: 'center', marginTop: '2rem' }}>Grabbing your location...</p>
    ) : (
      <MapContainer
        center={userLocation}
        zoom={14}
        style={{ height: '100%', width: '100%' }}
      >
        <TileLayer
          url={`https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${import.meta.env.VITE_GEOAPIFY_KEY}`}
          attribution="Geoapify"
        />
        <Marker position={userLocation}>
          <Popup>You are here</Popup>
        </Marker>
        {challenges.map((challenge) => (
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
