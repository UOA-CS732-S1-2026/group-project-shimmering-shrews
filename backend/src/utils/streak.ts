const MS_PER_DAY = 1000 * 60 * 60 * 24

export const startOfUtcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

export const calculateNextStreakCount = (
  lastCompletedChallenge: Date | null,
  currentStreakCount: number,
  completedAt: Date
) => {
  if (!lastCompletedChallenge) {
    return 1
  }

  const dayDifference = Math.floor(
    (startOfUtcDay(completedAt) - startOfUtcDay(lastCompletedChallenge)) / MS_PER_DAY
  )

  if (dayDifference <= 0) {
    return Math.max(currentStreakCount, 1)
  }

  if (dayDifference === 1) {
    return currentStreakCount + 1
  }

  return 1
}
