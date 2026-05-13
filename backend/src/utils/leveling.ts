const BASE_XP_TO_LEVEL_UP = 30
const XP_LEVEL_INCREMENT = 15

// Calculates the XP required to reach the next level from the current level.
export const getXpRequiredForNextLevel = (level: number) => {
  return BASE_XP_TO_LEVEL_UP + (Math.max(level, 1) - 1) * XP_LEVEL_INCREMENT
}

// Calculates the total XP required to reach the start of a given level.
export const getXpForLevelStart = (level: number) => {
  let totalXp = 0

  for (let currentLevel = 1; currentLevel < Math.max(level, 1); currentLevel += 1) {
    totalXp += getXpRequiredForNextLevel(currentLevel)
  }

  return totalXp
}

// Determines the user's level based on their total XP earned.
export const calculateLevel = (xpEarned: number) => {
  const safeXp = Math.max(xpEarned, 0)
  let level = 1

  while (safeXp >= getXpForLevelStart(level + 1)) {
    level += 1
  }

  return level
}

// Calculates the total XP required to reach the next level.
export const getXpForNextLevel = (level: number) => {
  return getXpForLevelStart(Math.max(level, 1) + 1)
}
