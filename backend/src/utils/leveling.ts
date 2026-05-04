const BASE_XP_TO_LEVEL_UP = 30
const XP_LEVEL_INCREMENT = 15

export const getXpRequiredForNextLevel = (level: number) => {
  return BASE_XP_TO_LEVEL_UP + (Math.max(level, 1) - 1) * XP_LEVEL_INCREMENT
}

export const getXpForLevelStart = (level: number) => {
  let totalXp = 0

  for (let currentLevel = 1; currentLevel < Math.max(level, 1); currentLevel += 1) {
    totalXp += getXpRequiredForNextLevel(currentLevel)
  }

  return totalXp
}

export const calculateLevel = (xpEarned: number) => {
  const safeXp = Math.max(xpEarned, 0)
  let level = 1

  while (safeXp >= getXpForLevelStart(level + 1)) {
    level += 1
  }

  return level
}

export const getXpForNextLevel = (level: number) => {
  return getXpForLevelStart(Math.max(level, 1) + 1)
}
