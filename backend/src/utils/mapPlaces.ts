export const mapPlace = ( place: any ) => ({

    name: place.properties.name,
    latitude: place.geometry.coordinates[1],
    longitude: place.geometry.coordinates[0],
    category: place.properties.categories[1], // Temporary 
    place_id: place.properties.place_id, // Might be useful for determining duplicate locations
    
})