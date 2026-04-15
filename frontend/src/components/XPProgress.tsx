type XPProgressProps = {
  currentXP: number
  levelStartXP: number
  nextLevelXP: number
}

function XPProgress({ currentXP, levelStartXP, nextLevelXP }: XPProgressProps) {
  const earnedThisLevel = currentXP - levelStartXP
  const requiredThisLevel = nextLevelXP - levelStartXP
  const progress = Math.min(Math.max((earnedThisLevel / requiredThisLevel) * 100, 0), 100)

  return (
    <div className="xp-progress" aria-label={`${Math.round(progress)} percent to next level`}>
      <div className="xp-progress__meta">
        <span>{currentXP.toLocaleString()} XP</span>
        <span>{nextLevelXP.toLocaleString()} XP</span>
      </div>
      <div className="xp-progress__track">
        <div className="xp-progress__bar" style={{ width: `${progress}%` }} />
      </div>
      <p>{Math.round(progress)}% to Level Up</p>
    </div>
  )
}

export default XPProgress
