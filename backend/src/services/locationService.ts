import { mapPlace } from '../utils/mapPlaces';
import { createLocations } from '../daos/locationDao'
import { DEFAULT_LOCATION_CATEGORY, DEFAULT_LOCATION_FETCH_LIMIT, DEFAULT_LOCATION_CREATE_LIMIT } from '../config/constants'


type GeoapifyResponse = {
  features?: unknown
}

// Generates a randomised bounding box around Auckland CBD by applying
// a small random offset to the base coordinates. This ensures each
// request to Geoapify returns varied locations rather than the same ones.
const getRandomisedBoundingBox = () => {
  // Base coordinates for Auckland CBD bounding box
  const baseLngMin = 174.73402155444433
  const baseLatMin = -36.88354209657474
  const baseLngMax = 174.79018430176848
  const baseLatMax = -36.840352394480576

  // Random offset up to ~500m in any direction
  const latOffset = (Math.random() - 0.5) * 0.01
  const lngOffset = (Math.random() - 0.5) * 0.01

  return {
    lngMin: baseLngMin + lngOffset,
    latMin: baseLatMin + latOffset,
    lngMax: baseLngMax + lngOffset,
    latMax: baseLatMax + latOffset,
  }
}

// Fetches locations from Geoapify's Places API within a randomised
// bounding box around Auckland CBD. Randomising the bounding box
// ensure varied results are returned on each request.
export const fetchLocations = async (category = DEFAULT_LOCATION_CATEGORY, limit = DEFAULT_LOCATION_FETCH_LIMIT) => {
  const { lngMin, latMin, lngMax, latMax } = getRandomisedBoundingBox()


  // Searches for locations in a randomised bounding box around the CBD
  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=rect:${lngMin},${latMin},${lngMax},${latMax}&limit=${limit}&apiKey=${process.env.VITE_GEOAPIFY_KEY}`

  try {
    const res = await fetch(url)
    if (!res.ok) {
      throw new Error(`Geoapify error: ${res.status}`)
    }
    const data = await res.json() as GeoapifyResponse

    // The test suite covers malformed Geoapify payloads explicitly. Validating
    // the shape prevents downstream mappers from failing with unclear
    // property-access errors when the external API returns unexpected JSON.
    if (typeof data !== 'object' || data === null || !Array.isArray(data.features)) {
      throw new Error('Geoapify response missing features array')
    }

    return data.features
  } catch (err) {
    console.error('Geoapify fetch failed:', err)
    throw err
  }
}

// Fetches locations from Geoapify and saves them to the database.
// Skips duplicates automatically via the DAO layer.
// Returns a count object indicating how many locations were created.
export const addLocations = async (category = DEFAULT_LOCATION_CATEGORY, limit = DEFAULT_LOCATION_CREATE_LIMIT) => {
  // Based on the seeded location records, the categories would be 'catering.cafe', 'leisure.park' and 'sports.fitness_centre'
  const places = await fetchLocations(category, limit)
  const data = []
  for (const place of places) {
    data.push(mapPlace(place, category))
  }

  // Empty API responses are valid and should not create a pointless database
  // call. Unit tests assert the service returns a createMany-like count object
  // so callers can handle empty imports the same way as successful imports.
  if (data.length === 0) {
    return { count: 0 }
  }

  return createLocations(data)
}