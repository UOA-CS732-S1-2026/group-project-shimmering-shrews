export const mapPlace = ( place: any, category: string ) => ({
    name: place.properties.name,
    latitude: place.geometry.coordinates[1],
    longitude: place.geometry.coordinates[0],
    category: category,    
})