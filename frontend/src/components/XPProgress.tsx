type XPProgressProps = {
  currentXP: number
  levelStartXP: number
  nextLevelXP: number
}

// Displays the user's XP progress bar for the current level.
// Calculates progress percentage and XP remaining to the next level.
function XPProgress({ currentXP, levelStartXP, nextLevelXP }: XPProgressProps) {
  // XP earned within the current level only (not total XP)
  const earnedThisLevel = currentXP - levelStartXP
  const requiredThisLevel = nextLevelXP - levelStartXP

  // Clamp progress between 0 and 100 to avoid overflowing the bar
  const progress = Math.min(Math.max((earnedThisLevel / requiredThisLevel) * 100, 0), 100)
  const xpRemaining = Math.max(nextLevelXP - currentXP, 0)

  return (
    <div className="xp-progress" aria-label={`${Math.round(progress)} percent to next level`}>
      <div className="xp-progress__meta">
        <span>{earnedThisLevel.toLocaleString()} XP</span>
        <span>{requiredThisLevel.toLocaleString()} XP</span>
      </div>
      <div className="xp-progress__track">
        <div className="xp-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <p>{xpRemaining.toLocaleString()} XP to Level Up</p>
    </div>
  )
}

export default XPProgress
