const FALLBACK_TIME_ZONE = 'Pacific/Auckland'

export const getBrowserTimeZone = () => {
  return Intl.DateTimeFormat().resolvedOptions().timeZone || FALLBACK_TIME_ZONE
}

export const getTimeZoneHeaders = () => ({
  'X-Time-Zone': getBrowserTimeZone(),
})
