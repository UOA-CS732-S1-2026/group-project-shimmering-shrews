import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
import type { Challenge } from '../types/challenge'
import { checkInChallenge } from '../services/challenges'


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

export default function ChallengeDetailView({
    challenge,
    checkedInChallenges,
    setCheckedInChallenges,
    goToChallengeList, 
    }: {goToChallengeList: () => void, 
        challenge: Challenge | null,
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
    
    if (!challenge) {
        return <div style={containerStyle}>
            <h1 style={titleStyle}>Challenge Details</h1>
            <p>Challenge not found.</p>
            <button 
            onClick={goToChallengeList}
            style={buttonStyle}>Return to list</button>
        </div>
    }
    
    
    const checkedIn = checkedInChallenges.includes(challenge.id);
    
    const MAX_DISTANCE = 700; // In metres
    const checkIn = () => {
        if (checkedIn) { return; 
        } // Prevent re-checking if already complete

        if (!navigator.geolocation) {
            alert("Geolocation is not supported by your browser.");
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const { latitude, longitude } = position.coords;
                
                // Calculate distance from challenge
                const distance = getDistanceMetres([latitude, longitude],[Number(challenge.location.latitude), Number(challenge.location.longitude)]);
                if (distance <= MAX_DISTANCE) {
                    try {
                        await checkInChallenge(challenge.id);

                        setCheckedInChallenges(prev => [...prev, challenge.id]);

                        // REPLACE WITH XP AND BANNER POP UP
                        alert( "Challenge sucessfully completed");
                    } catch (error) {
                        alert(`Failed to check into challenge. Please try again.`);
                    } 
                } else {
                    // Too far
                    alert(`You are too far away (${Math.round(distance)}m). You must be within ${MAX_DISTANCE}m of the challenge.`);
                }
            },
            (error) => {
                alert("Unable to retrieve your location. Please enable location services.");
            }
        );
    };


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
                    <h2 style={challengeTitleStyle}>{challenge.name}</h2>
                    <p style={detailDescriptionStyle}>{challenge.description ?? 'No description available.'}</p>
                    <p style={{margin: "10px 0"}}>Location: {challenge.location.name}</p>
                    <div style={{
                        display: "flex", 
                        gap: "10px",
                        alignItems: "center",
                    }}>
                    <span style={{...badgeStyle, background: categoryColors[challenge.challenge_category.name] || "#ddd"}}>
                        {challenge.challenge_category.name}
                    </span>
                    <span style={xpStyle}>{challenge.xp_worth} XP</span>
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
