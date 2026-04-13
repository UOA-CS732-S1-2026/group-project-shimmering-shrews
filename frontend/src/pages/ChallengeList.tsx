import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
export default function ChallengeList({goToDetailView}: {goToDetailView: (challenge: any) => void }) {

  type Challenge ={
    id: number;
    title: string;
    location: string;
    description: string;
    category: string;
    xp: string;
  }
    
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
        fetch("http://localhost:5000/challenges")
          .then(res => res.json())
          .then(data => setChallenges(data))
          .catch(err => console.error("Error fetching challenges:", err))
      }, [])
    const handleClose = (id: number) => {
        setChallenges(prev => prev.filter(challenge => challenge.id !== id))
    }



    const MapView = () => {
        console.log("Map View clicked")
    }
    const ReturnToProfile = () => {
        console.log("Return to Profile clicked")
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
                {challenge.title}
            </h2>
            <p style={descriptionStyle}>
                {challenge.description}
            </p>
            <div style={rowStyle}>
              <span style={{...badgeStyle, background: categoryColors[challenge.category] || "#ddd"}}>
                {challenge.category}
              </span>
              <span style={xpStyle}>
                {challenge.xp}
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
            onClose={() => handleClose(challenge.id)} 
          />

        ))}
      </div>
    
        <div style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
        }}>
            <button onClick={MapView} style={buttonStyle}>
                Map View
            </button>
            <button onClick={ReturnToProfile} style={buttonStyle}>
                Return to Profile
            </button>
        </div>
        
    </div>
    

  )
}