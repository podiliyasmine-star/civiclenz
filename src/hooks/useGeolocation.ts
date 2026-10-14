import { useState, useCallback } from 'react'

interface GeolocationState {
  latitude: number | null
  longitude: number | null
  address: string | null
  error: string | null
  loading: boolean
}

export function useGeolocation() {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    address: null,
    error: null,
    loading: false,
  })

  const getLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }))
      return
    }

    setState((s) => ({ ...s, loading: true, error: null }))

    return new Promise<{ latitude: number; longitude: number; address: string | null }>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords
          let address: string | null = null

          // Reverse geocode using Nominatim (OSM - free, no API key needed)
          try {
            const res = await fetch(
              `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
              { headers: { 'Accept-Language': 'en' } }
            )
            const data = await res.json()
            address = data.display_name ?? null
          } catch {
            // Silently fail geocoding
          }

          setState({ latitude, longitude, address, error: null, loading: false })
          resolve({ latitude, longitude, address })
        },
        (err) => {
          const message =
            err.code === 1
              ? 'Location permission denied. Please allow location access.'
              : err.code === 2
              ? 'Location unavailable. Please try again.'
              : 'Location request timed out.'
          setState((s) => ({ ...s, error: message, loading: false }))
          reject(new Error(message))
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      )
    })
  }, [])

  return { ...state, getLocation }
}
