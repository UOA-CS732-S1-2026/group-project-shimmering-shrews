const APP_TIME_ZONE = 'Pacific/Auckland'
const MS_PER_DAY = 1000 * 60 * 60 * 24

export const startOfUtcDay = (date: Date) =>
  Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())

const getCalendarDayMs = (date: Date, timeZone = APP_TIME_ZONE) => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return Date.UTC(year, month - 1, day)
}

export const getCalendarDayDifference = (
  laterDate: Date,
  earlierDate: Date
) => {
  return Math.round(
    (getCalendarDayMs(laterDate) - getCalendarDayMs(earlierDate)) / MS_PER_DAY
  )
}

export const calculateNextStreakCount = (
  lastCompletedChallenge: Date | null,
  currentStreakCount: number,
  completedAt: Date
) => {
  if (!lastCompletedChallenge) {
    return 1
  }

  const dayDifference = getCalendarDayDifference(completedAt, lastCompletedChallenge)

  if (dayDifference <= 0) {
    return Math.max(currentStreakCount, 1)
  }

  if (dayDifference === 1) {
    return currentStreakCount + 1
  }

  return 1
}

export const getActiveStreakCount = (
  currentStreakCount: number,
  lastCompletedChallenge: Date | null,
  now: Date
) => {
  if (!lastCompletedChallenge || currentStreakCount <= 0) {
    return 0
  }

  const dayDifference = getCalendarDayDifference(now, lastCompletedChallenge)

  return dayDifference <= 1 ? currentStreakCount : 0
}
