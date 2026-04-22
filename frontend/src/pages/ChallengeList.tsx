import React from 'react'
import { useNavigate } from 'react-router-dom'
import { getChallenges } from '../services/challenges'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
import type { Challenge } from '../types/challenge'

export default function ChallengeList({goToDetailView}: {goToDetailView: (challenge: Challenge) => void }) {
    const navigate = useNavigate()
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
      if (loading) {
        return <div style={containerStyle}>
          <h1 style={titleStyle}>Today's Challenges</h1>
          <p>Loading...</p>
        </div>
      }
      if (error) {
        return <div style={containerStyle}>
          <h1 style={titleStyle}>Today's Challenges</h1>
          <p>{error}</p>
        </div>
      }
    const handleClose = (id: number) => {
        setChallenges(prev => prev.filter(challenge => challenge.id !== id))
    }

    
  function ChallengeCard({challenge, onClose}: {challenge: Challenge, onClose: (id: number) => void}) {
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
      <h1 style={titleStyle}>Today's Challenges</h1>
      <div>
        {challenges.map((challenge) => (
          <ChallengeCard 
            key={challenge.id} 
            challenge={challenge} 
            onClose={handleClose} 
          />

        ))}
      </div>
    
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        }}>
            <button onClick={() => window.location.assign('/#map')} style={buttonStyle}>
                Map View
            </button>
            <button onClick={() => navigate('/profile')} style={buttonStyle}>
                Return to Profile
            </button>
        </div>
        
    </div>
    

  )
}
