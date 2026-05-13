import { useState, useEffect } from 'react'

type PermissionStatus = 'not-asked' | 'granted' | 'denied'

// Custom hook that tracks the browser's geolocation permission state and the user's current location.
// Automatically fetches the user's location if permission is already granted on mount.
export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not-asked')
  const [userLocation, setUserLocation] = useState<[number, number] | null>(null)

  // Maps the browser's PermissionState string to the app's PermissionStatus type
  const mapPermissionState = (state: string): PermissionStatus => {
    if (state === 'granted') return 'granted'
    if (state === 'denied') return 'denied'
    return 'not-asked'
  }

  // Triggers a browser geolocation request and updates permission status and location on result.
  const requestPermission = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported in this browser')
      setPermissionStatus('not-asked')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setPermissionStatus('granted')
        setUserLocation([position.coords.latitude, position.coords.longitude])
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied')
          return
        }
        setPermissionStatus('not-asked')
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    )
  }

  useEffect(() => {
    let permissionQuery: globalThis.PermissionStatus | null = null

    const checkPermissionState = async () => {
      if (!navigator.permissions) {
        console.warn('Permissions API not available')
        return
      }
      try {
        const result = await navigator.permissions.query({ name: 'geolocation' })
        permissionQuery = result
        setPermissionStatus(mapPermissionState(result.state))

        // If permission is already granted, fetch location immediately
        if (result.state === 'granted') {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              setUserLocation([position.coords.latitude, position.coords.longitude])
            },
            () => {}
          )
        }

        // Listen for permission state changes
        result.onchange = () => {
          setPermissionStatus(mapPermissionState(result.state))
        }
      } catch (err) {
        console.warn('Could not query permission state:', err)
      }
    }

    checkPermissionState()
    return () => {
      // Clean up the onchange listener to prevent memory leaks
      if (permissionQuery) permissionQuery.onchange = null
    }
  }, [])

  return { permissionStatus, requestPermission, userLocation }
}