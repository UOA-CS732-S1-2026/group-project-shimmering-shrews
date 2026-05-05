const getGeoapifyKey = () => {
  const key = import.meta.env.VITE_GEOAPIFY_KEY
  if (!key) {
    throw new Error('VITE_GEOAPIFY_KEY is not configured in .env')
  }
  return key
}

/**
 * Fetches a route from the Geoapify Routing API.
 * @param start - The starting coordinates [latitude, longitude].
 * @param end - The ending coordinates [latitude, longitude].
 * @param mode - The travel mode (e.g., 'drive', 'walk', 'bicycle').
 * @returns A promise that resolves to an array of coordinate pairs representing the route.
 */
export const getRoute = async (
  start: [number, number],
  end: [number, number],
  mode = 'walk'
): Promise<[number, number][]> => {
  const apiKey = getGeoapifyKey()
  const waypoints = `${start[0]},${start[1]}|${end[0]},${end[1]}`
  const url = `https://api.geoapify.com/v1/routing?waypoints=${waypoints}&mode=${mode}&apiKey=${apiKey}`

  const response = await fetch(url)
  if (!response.ok) {
    console.error('Failed to fetch route from Geoapify')
    return []
  }

  const result = await response.json()

  const geometry = result.features?.[0]?.geometry

  if (!geometry?.coordinates) {
    console.error('No route geometry found in Geoapify response')
    return []
  }

  const coordinates = Array.isArray(geometry.coordinates[0]?.[0])
    ? geometry.coordinates[0]
    : geometry.coordinates

  if (!Array.isArray(coordinates)) {
    console.error('Unexpected route geometry format from Geoapify')
    return []
  }

  // The coordinates are [longitude, latitude], so we need to swap them for Leaflet
  return coordinates.map((coord: [number, number]) => [coord[1], coord[0]])
}
