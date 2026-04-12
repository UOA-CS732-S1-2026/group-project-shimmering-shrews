import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
export default function ChallengeList({goToDetailView}: {goToDetailView: (challenge: any) => void }) {

    
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


    const initialChallenges = [
        { id: 1, title: "Challenge 1", location: "location for Challenge 1", description: "Description for Challenge 1", category: "category for Challenge 1", xp: "50xp" },
        { id: 2, title: "Challenge 2", location: "location for Challenge 2", description: "Description for Challenge 2", category: "category for Challenge 2", xp: "50xp" },
        { id: 3, title: "Challenge 3", location: "location for Challenge 3", description: "Description for Challenge 3", category: "category for Challenge 3", xp: "50xp" },
    ]

    const rowStyle = {
        display: "flex",
        gap: "10px",
        alignItems: "center",
    } as const
    const [challenges, setChallenges] = React.useState(initialChallenges)
    const handleClose = (id: number) => {
        setChallenges(prev => prev.filter(challenge => challenge.id !== id))
    }



    const MapView = () => {
        console.log("Map View clicked")
    }
    const ReturnToProfile = () => {
        console.log("Return to Profile clicked")
    }

    type Challenge ={
    id: number;
    title: string;
    location: string;
    description: string;
    category: string;
    xp: string;
    }
  function ChallengeCard({challenge, onClose}: {challenge: Challenge, onClose: (id: number) => void}) {
    return (
        <div style={{...cardStyle, cursor: "pointer", transition: "transform 0.2s"}}
          onClick={() => goToDetailView(challenge)}
        >
            <button style={closeButtonStyle} onClick={() => onClose(challenge.id)}>
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