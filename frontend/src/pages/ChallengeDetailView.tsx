import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
export default function ChallengeDetailView({
    challenge,
    checkedInChallenges,
    setCheckedInChallenges,
    goToChallengeList, 
    }: {goToChallengeList: () => void, 
        challenge: any,
        checkedInChallenges: number[],
        setCheckedInChallenges: React.Dispatch<React.SetStateAction<number[]>>,
    }) {
    
    const detailDescriptionStyle = {
        margin:"6px 0", 
        color: "#555",
        textAlign: "left",
        fontSize: "14px"
    } as const
    const checkInButtonStyle = {
        marginTop: "20px",
        padding: "10px 20px",
        borderRadius: "8px",
        background: "green",
        color: "white",
        border: "none",
        cursor: "pointer",

        alignSelf: "flex-end",
        } as const
    
    const checkedIn = checkedInChallenges.includes(challenge.id)
    const checkIn = () => {
        setCheckedInChallenges((prev: number[]) => {
            if (checkedIn) {
                return prev.filter(id => id !== challenge.id)
            } else {
                return [...prev, challenge.id]
            }
        })
    }


    return (
        <div style={containerStyle}>
            <h1 style={titleStyle}>Challenge Details</h1>
            <div style={{
                ...cardStyle, 
                display: "flex",
                flexDirection: "column",
                padding: "20px",
                minHeight: "500px",
                maxWidth: "500px",
                margin: "0 auto",
                justifyContent: "space-between",
                }}>
                <div>
                    <h2 style={challengeTitleStyle}>{challenge.title}</h2>
                    <p style={detailDescriptionStyle}>{challenge.description}</p>
                    <p style={{margin: "10px 0"}}>Location: {challenge.location}</p>
                    <div style={{
                        display: "flex", 
                        gap: "10px",
                        alignItems: "center",
                    }}>
                    <span style={{...badgeStyle, background: categoryColors[challenge.category] || "#ddd"}}>
                        {challenge.category}
                    </span>
                    <span style={xpStyle}>{challenge.xp}</span>
                    </div> 
                </div>
                <div>
                    <button 
                        onClick={checkIn} 
                        style={{...checkInButtonStyle,
                        background: checkedIn ? "gray" : "green",
                        }}>
                        {checkedIn ? "Checked In" : "Check In"}
                    </button> 
                </div>
            </div>
            
            <button 
            onClick={goToChallengeList}
            style={buttonStyle}>Return to list</button>
        </div>
    );
    }