type GeoapifyPlace = {
  properties: {
    name?: string
  }
  geometry: {
    coordinates: [number, number]
  }
}

export const mapPlace = (place: GeoapifyPlace, category: string) => ({
    name: place.properties.name ?? 'Unnamed location',
    latitude: place.geometry.coordinates[1],
    longitude: place.geometry.coordinates[0],
    category: category,    
})
