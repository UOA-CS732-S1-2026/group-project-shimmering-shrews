type GeoapifyPlace = {
  properties: {
    name?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

// Validates coordinate values are within expected ranges.
// Ensures latitude is between -90 and 90, longitude between -180 and 180.
const assertValidCoordinate = (
  value: unknown,
  coordinateName: 'latitude' | 'longitude',
  min: number,
  max: number
) => {
  if (typeof value !== 'number' || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`Invalid ${coordinateName} from Geoapify response`)
  }

  return value
}

// Converts a Geoapify place object to a location database format.
// Validates and normalizes coordinates, handles missing names.
export const mapPlace = (place: GeoapifyPlace, category: string) => {
    const [rawLongitude, rawLatitude] = place.geometry.coordinates
    const latitude = assertValidCoordinate(rawLatitude, 'latitude', -90, 90)
    const longitude = assertValidCoordinate(rawLongitude, 'longitude', -180, 180)

    return {
        name: place.properties.name ?? 'Unnamed location',
        latitude,
        longitude,
        category: category,
    }
}
