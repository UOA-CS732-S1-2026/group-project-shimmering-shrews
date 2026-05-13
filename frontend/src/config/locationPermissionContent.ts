// UI strings for location permission prompts and banners.
// Centralised here so messaging is consistent across all location permission states.

export const LOCATION_PERMISSION_DIALOG_TITLE = 'Enable Location Access'

// Shown in the permission dialog before the browser prompt is triggered
export const LOCATION_PERMISSION_DIALOG_MESSAGE =
  'We use your location to show nearby challenges and support check-ins. You can continue without enabling it, but location-based features will be limited.'

// Shown when location permission has been denied in browser/device settings
export const LOCATION_PERMISSION_SETTINGS_GUIDANCE =
  'Please enable location in your browser or device settings to see nearby challenges.'

// Shown as a banner when location has not yet been granted
export const LOCATION_PERMISSION_BANNER_MESSAGE =
  'Enable location to use nearby challenge filtering and check-ins.'

// Shown on the challenge detail view when location is needed to check in
export const LOCATION_PERMISSION_CHECKIN_MESSAGE =
  'Enable location access in your browser settings to check in.'

// Shown on the challenge list view when location improves accuracy
export const LOCATION_PERMISSION_CHALLENGES_ACCURACY_MESSAGE =
  'Enable location to improve nearby challenge accuracy.'