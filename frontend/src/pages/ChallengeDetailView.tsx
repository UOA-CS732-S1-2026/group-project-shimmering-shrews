import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
import type { Challenge } from '../types/challenge'
import { useLocationPermission } from '../hooks/useLocationPermission'
import { DEV_SHOW_ALL } from '../config/featureFlags'

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
    const { permissionStatus } = useLocationPermission()
    
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
    
    const checkedIn = checkedInChallenges.includes(challenge.id)
    const isCheckInDisabled = !DEV_SHOW_ALL && permissionStatus !== 'granted'
    
    const checkIn = () => {
        if (isCheckInDisabled) {
            return
        }
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
                        disabled={isCheckInDisabled}
                        title={isCheckInDisabled ? "Location access required to check in" : ""}
                        style={{...checkInButtonStyle,
                        background: isCheckInDisabled ? "#ccc" : (checkedIn ? "gray" : "green"),
                        cursor: isCheckInDisabled ? "not-allowed" : "pointer",
                        opacity: isCheckInDisabled ? 0.6 : 1,
                        }}>
                        {isCheckInDisabled ? "Location Required" : (checkedIn ? "Checked In" : "Check In")}
                    </button>
                    {isCheckInDisabled && (
                        <p style={{fontSize: "0.9rem", color: "#999", marginTop: "0.5rem"}}>
                            Enable location access in your browser settings to check in.
                        </p>
                    )}
                </div>
            </div>
            
            <button 
            onClick={goToChallengeList}
            style={buttonStyle}>Return to list</button>
        </div>
    );
    }
