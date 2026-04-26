import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getChallenges } from '../services/challenges'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
import type { Challenge } from '../types/challenge'
import { useLocationPermission } from '../hooks/useLocationPermission'
import { DEV_SHOW_ALL } from '../config/featureFlags'
import LocationPermissionDialog from '../components/LocationPermissionDialog.tsx'

export default function ChallengeList({goToDetailView}: {goToDetailView: (challenge: Challenge) => void }) {
    const navigate = useNavigate()
  const { permissionStatus, requestPermission } = useLocationPermission()
    const [showPermissionDialog, setShowPermissionDialog] = React.useState(false)
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState<string | null>(null)
    const closeButtonStyle = {
      position: "absolute",
      top: "10px",
      right: "10px",
      border: "none",
      background: "transparent",
      cursor: "pointer",
      fontSize: "18px",
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
        title="Enable Location Access"
        message="We use your location to show nearby challenges and support check-ins. You can continue without enabling it, but location-based features will be limited."
        onAllow={allowPermissionRequest}
        onCancel={closePermissionDialog}
      />
    )

    const descriptionStyle = {
        margin:"6px 0", 
        color: "#555",
        textAlign: "left",
        fontSize: "14px"
    } as const


    const rowStyle = {
        display: "flex",
        gap: "10px",
        alignItems: "center",
    } as const
    const [challenges, setChallenges] = React.useState<Challenge[]>([])
      React.useEffect(() => {
        getChallenges()
          .then(data => {
            setChallenges(data)
            setError(null)
          })
          .catch(() => setError("Could not load challenges."))
          .finally(() => setLoading(false))
      }, [])
      if (error) {
        return <div style={containerStyle}>
          <h1 style={titleStyle}>Today's Challenges</h1>
          <p>{error}</p>
        </div>
      }
    
    if (isListDisabled) {
      return <div style={containerStyle}>
        {permissionDialog}
        <h1 style={titleStyle}>Today's Challenges</h1>
        <div style={{textAlign: 'center', padding: '2rem'}}>
          <p style={{color: '#666', marginBottom: '1rem'}}>Location access is required to view challenges.</p>
          <p style={{fontSize: '0.9rem', color: '#999', marginBottom: '1.5rem'}}>
            {permissionStatus === 'denied'
              ? 'Please enable location in your browser or device settings.'
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
    }

    const handleClose = (id: number) => {
        setChallenges(prev => prev.filter(challenge => challenge.id !== id))
    }

    
  function ChallengeCard({challenge, onClose, loading}: {challenge?: Challenge, onClose: (id: number) => void, loading: boolean}) {
    if (loading || !challenge) {
      return (
        <div style={{...cardStyle, cursor: "pointer", transition: "transform 0.2s"}}
          onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
            <h2 style={challengeTitleStyle} className='skeleton skeleton-text' />
            <p style={descriptionStyle} className='skeleton skeleton-text small'/>
            <div style={rowStyle}>
              <span style={{...badgeStyle, background: "#ddd"}}/>
              <span style={xpStyle} className='skeleton skeleton-text'/>
            </div>
        </div>
      )
    }
    
    return (
        <div style={{...cardStyle, cursor: "pointer", transition: "transform 0.2s"}}
          onClick={() => goToDetailView(challenge)}
          onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1.02)";
          }}
          onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = "scale(1)";
          }}
        >
            <button style={closeButtonStyle} onClick={(e) => {
                e.stopPropagation();
                onClose(challenge.id);
            }}>
                x
            </button>
            <h2 style={challengeTitleStyle}>
                {challenge.name}
            </h2>
            <p style={descriptionStyle}>
                {challenge.description ?? 'No description available.'}
            </p>
            <div style={rowStyle}>
              <span style={{...badgeStyle, background: categoryColors[challenge.challenge_category.name] || "#ddd"}}>
                {challenge.challenge_category.name}
              </span>
              <span style={xpStyle}>
                {challenge.xp_worth} XP
              </span>
            </div>
        </div>
    )
  }


  return (
    <div style={containerStyle}>
      {permissionDialog}
      <h1 style={titleStyle}>Today's Challenges</h1>
      {permissionStatus !== 'granted' && (
        <div style={{
          marginBottom: '12px',
          padding: '10px 12px',
          background: '#f5f7fa',
          border: '1px solid #d9dee7',
          borderRadius: '8px',
        }}>
          <p style={{ margin: 0, color: '#555', fontSize: '0.9rem' }}>
            Enable location to improve nearby challenge accuracy.
          </p>
          <button onClick={openPermissionDialog} style={{ ...buttonStyle, marginTop: '8px' }}>
            Enable Location
          </button>
        </div>
      )}
      <div>
        {loading
          ? ['1', '2', '3', '4', '5', '6'].map((i) => <ChallengeCard key={i} onClose={handleClose} loading />)
          : challenges.map((challenge) => (
            <ChallengeCard 
              key={challenge.id} 
              challenge={challenge} 
              onClose={handleClose} 
              loading={loading}
            />
          ))
        }
      </div>
    
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        }}>
            <button onClick={() => navigate('/map')} style={buttonStyle}>
                Map View
            </button>
            <button onClick={() => navigate('/profile')} style={buttonStyle}>
                Return to Profile
            </button>
        </div>
        
    </div>
    

  )
}
