import React from 'react'
import { badgeStyle, buttonStyle, cardStyle, categoryColors, containerStyle, challengeTitleStyle, titleStyle, xpStyle } from '../styles/challengeStyle'
import type { Challenge } from '../types/challenge'
import { checkInChallenge } from '../services/challenges'

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
    const [checkingIn, setCheckingIn] = React.useState(false)
    const [checkInError, setCheckInError] = React.useState<string | null>(null)
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
    const checkIn = async () => {
        if (checkedIn || checkingIn) {
            return
        }

        setCheckingIn(true)
        setCheckInError(null)

        try {
            await checkInChallenge(challenge.id)
            setCheckedInChallenges((prev: number[]) => (
                prev.includes(challenge.id) ? prev : [...prev, challenge.id]
            ))
        } catch (error) {
            setCheckInError(
                error instanceof Error ? error.message : 'Could not check in to challenge.'
            )
        } finally {
            setCheckingIn(false)
        }
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
                        disabled={checkedIn || checkingIn}
                        style={{...checkInButtonStyle,
                        background: checkedIn ? "gray" : "green",
                        cursor: checkedIn || checkingIn ? "not-allowed" : "pointer",
                        }}>
                        {checkingIn ? "Checking In..." : checkedIn ? "Checked In" : "Check In"}
                    </button> 
                    {checkInError ? <p style={{ color: "#b00020", marginTop: "10px" }}>{checkInError}</p> : null}
                </div>
            </div>
            
            <button 
            onClick={goToChallengeList}
            style={buttonStyle}>Return to list</button>
        </div>
    );
    }
