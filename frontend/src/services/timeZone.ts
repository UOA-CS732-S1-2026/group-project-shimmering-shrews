// Fallback timezone used when the browser does not report one
const FALLBACK_TIME_ZONE = 'Pacific/Auckland'

// Returns the user's browser timezone, falling back to Auckland if unavailable.
export const getBrowserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE
}

// Returns headers containing the user's timezone for backend date calculations.
export const getTimeZoneHeaders = () => ({
  'X-Time-Zone': getBrowserTimeZone(),
})
