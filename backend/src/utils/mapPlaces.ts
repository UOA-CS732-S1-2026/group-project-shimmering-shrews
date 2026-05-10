type GeoapifyPlace = {
  properties: {
    name?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

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
