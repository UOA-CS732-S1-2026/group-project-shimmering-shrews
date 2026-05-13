import type { Request } from 'express'

import { ApiError } from './ApiError'
import { APP_TIME_ZONE, isSupportedTimeZone } from './streak'

const TIME_ZONE_HEADER = 'x-time-zone'

export const getRequestTimeZone = (req: Request) => {
  const rawTimeZone = req.get?.(TIME_ZONE_HEADER)?.trim()

  if (!rawTimeZone) {
    return APP_TIME_ZONE
  }

  if (!isSupportedTimeZone(rawTimeZone)) {
    throw new ApiError(400, 'X-Time-Zone must be a valid IANA timezone')
  }

  return rawTimeZone
}
