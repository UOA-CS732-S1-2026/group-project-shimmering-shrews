export const mapPlace = ( place: any ) => ({
    
    name: place.properties.name,
    latitude: place.geometry.coordinates[1],
    longitude: place.geometry.coordinates[0],
    category: place.properties.categories[1], // Temporary     
})