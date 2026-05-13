type XPProgressProps = {
  currentXP: number
  levelStartXP: number
  nextLevelXP: number
  currentLevel: number
}

// Displays the user's XP progress bar for the current level.
// Calculates progress percentage and XP remaining to the next level.
function XPProgress({ currentXP, levelStartXP, nextLevelXP, currentLevel }: XPProgressProps) {
  // XP earned within the current level only (not total XP)
  const earnedThisLevel = currentXP - levelStartXP
  const requiredThisLevel = nextLevelXP - levelStartXP

  // Clamp progress between 0 and 100 to avoid overflowing the bar
  const progress = Math.min(Math.max((earnedThisLevel / requiredThisLevel) * 100, 0), 100)
  const xpRemaining = Math.max(nextLevelXP - currentXP, 0)

  return (
    <div className="xp-progress" aria-label={`${Math.round(progress)} percent to next level`}>
      <div className="xp-progress__meta">
        <span>Level {currentLevel.toLocaleString()}</span>
        <span>Level {(currentLevel + 1).toLocaleString()}</span>
      </div>
      <div className="xp-progress__track">
        <div className="xp-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <p>Next Level XP: {earnedThisLevel.toLocaleString()} / {requiredThisLevel.toLocaleString()}</p>
    </div>
  )
}

export default XPProgress
