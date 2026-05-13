export const APP_TIME_ZONE = 'Pacific/Auckland'
const MS_PER_DAY = 1000 * 60 * 60 * 24

type CalendarDayParts = {
  year: number
  month: number
  day: number
}

// Extracts calendar day components (year, month, day) from a date in a specific time zone.
const getCalendarDayParts = (
  date: Date,
  timeZone = APP_TIME_ZONE
): CalendarDayParts => {
  const parts = new Intl.DateTimeFormat('en-NZ', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date)

  const year = Number(parts.find((part) => part.type === 'year')?.value)
  const month = Number(parts.find((part) => part.type === 'month')?.value)
  const day = Number(parts.find((part) => part.type === 'day')?.value)

  return { year, month, day }
}

// Checks if a time zone string is supported by the Intl API.
export const isSupportedTimeZone = (timeZone: string) => {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(new Date(0))
    return true
  } catch {
    return false
  }
}

// Calculates the UTC offset in milliseconds for a given time zone and date.
const getTimeZoneOffsetMs = (date: Date, timeZone = APP_TIME_ZONE) => {
  const offsetPart = new Intl.DateTimeFormat('en-US', {
    timeZone,
    timeZoneName: 'shortOffset',
  })
    .formatToParts(date)
    .find((part) => part.type === 'timeZoneName')?.value

  if (!offsetPart) {
    throw new Error(`Could not determine offset for ${timeZone}`)
  }

  const offsetPattern = /^GMT(?:(?<sign>[+-])(?<hours>\d{1,2})(?::(?<minutes>\d{2}))?)?$/
  const match = offsetPart.match(offsetPattern)

  if (!match?.groups) {
    throw new Error(`Could not parse offset ${offsetPart} for ${timeZone}`)
  }

  if (!match.groups.sign) {
    return 0
  }

  const sign = match.groups.sign === '-' ? -1 : 1
  const hours = Number(match.groups.hours)
  const minutes = Number(match.groups.minutes ?? '0')

  return sign * ((hours * 60 + minutes) * 60 * 1000)
}

// Converts a date to the number of milliseconds since UTC epoch for midnight of that calendar day.
const getCalendarDayMs = (date: Date, timeZone = APP_TIME_ZONE) => {
  const { year, month, day } = getCalendarDayParts(date, timeZone)

  return Date.UTC(year, month - 1, day)
}

// Gets the start of a calendar day (midnight) for a given time zone.
// Accounts for DST transitions by attempting up to 3 iterations to find the correct offset.
const getStartOfCalendarDayFromParts = (
  { year, month, day }: CalendarDayParts,
  timeZone = APP_TIME_ZONE
) => {
  const localMidnightAsUtc = Date.UTC(year, month - 1, day)
  let startOfDayMs = localMidnightAsUtc

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offsetMs = getTimeZoneOffsetMs(new Date(startOfDayMs), timeZone)
    const nextStartOfDayMs = localMidnightAsUtc - offsetMs

    if (nextStartOfDayMs === startOfDayMs) {
      break
    }

    startOfDayMs = nextStartOfDayMs
  }

  return new Date(startOfDayMs)
}

// Gets the start of the app calendar day (in APP_TIME_ZONE) for a given date.
export const getStartOfAppCalendarDay = (date: Date) => {
  return getStartOfCalendarDayFromParts(getCalendarDayParts(date))
}

// Gets the start of the user calendar day in their specified time zone.
export const getStartOfUserCalendarDay = (
  date: Date,
  timeZone = APP_TIME_ZONE
) => {
  return getStartOfCalendarDayFromParts(
    getCalendarDayParts(date, timeZone),
    timeZone
  )
}

// Gets the start of the next app calendar day (in APP_TIME_ZONE).
export const getNextStartOfAppCalendarDay = (date: Date) => {
  const parts = getCalendarDayParts(date)

  return getStartOfCalendarDayFromParts({
    ...parts,
    day: parts.day + 1,
  })
}

// Gets the start of the next user calendar day in their specified time zone.
export const getNextStartOfUserCalendarDay = (
  date: Date,
  timeZone = APP_TIME_ZONE
) => {
  const parts = getCalendarDayParts(date, timeZone)

  return getStartOfCalendarDayFromParts(
    {
      ...parts,
      day: parts.day + 1,
    },
    timeZone
  )
}

// Calculates the difference in calendar days between two dates in a specific time zone.
export const getCalendarDayDifference = (
  laterDate: Date,
  earlierDate: Date,
  timeZone = APP_TIME_ZONE
) => {
  return Math.round(
    (getCalendarDayMs(laterDate, timeZone) - getCalendarDayMs(earlierDate, timeZone)) / MS_PER_DAY
  )
}

// Calculates the next streak count based on the last completed challenge and current streak.
// Maintains streak if challenge was completed today or yesterday, otherwise resets to 1.
export const calculateNextStreakCount = (
  lastCompletedChallenge: Date | null,
  currentStreakCount: number,
  completedAt: Date,
  timeZone = APP_TIME_ZONE
) => {
  if (!lastCompletedChallenge) {
    return 1
  }

  const dayDifference = getCalendarDayDifference(
    completedAt,
    lastCompletedChallenge,
    timeZone
  )

  if (dayDifference <= 0) {
    return Math.max(currentStreakCount, 1)
  }

  if (dayDifference === 1) {
    return currentStreakCount + 1
  }

  return 1
}

// Determines if a streak is still active based on the last completed challenge date.
// Streak is active if completed within the last two calendar days.
export const getActiveStreakCount = (
  currentStreakCount: number,
  lastCompletedChallenge: Date | null,
  now: Date,
  timeZone = APP_TIME_ZONE
) => {
  if (!lastCompletedChallenge || currentStreakCount <= 0) {
    return 0
  }

  const dayDifference = getCalendarDayDifference(
    now,
    lastCompletedChallenge,
    timeZone
  )

  return dayDifference <= 1 ? currentStreakCount : 0
}
