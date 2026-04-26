import { useState, useEffect } from 'react'

type PermissionStatus = 'not-asked' | 'granted' | 'denied'

export const useLocationPermission = () => {
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('not-asked')

  const mapPermissionState = (state: string): PermissionStatus => {
    if (state === 'granted') {
      return 'granted'
    }
    if (state === 'denied') {
      return 'denied'
    }
    return 'not-asked'
  }

  const requestPermission = () => {
    if (!navigator.geolocation) {
      console.warn('Geolocation is not supported in this browser')
      setPermissionStatus('not-asked')
      return
    }

    navigator.geolocation.getCurrentPosition(
      () => {
        setPermissionStatus('granted')
      },
      (error) => {
        if (error.code === error.PERMISSION_DENIED) {
          setPermissionStatus('denied')
          return
        }
        setPermissionStatus('not-asked')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
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
        result.onchange = () => {
          setPermissionStatus(mapPermissionState(result.state))
        }
      } catch (err) {
        console.warn('Could not query permission state:', err)
      }
    }

    checkPermissionState()

    return () => {
      if (permissionQuery) {
        permissionQuery.onchange = null
      }
    }
  }, [])

  return {
    permissionStatus,
    requestPermission,
  }
}
