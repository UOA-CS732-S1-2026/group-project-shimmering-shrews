import { mapPlace } from '../utils/mapPlaces';
import { createLocations } from '../daos/locationDao'

type GeoapifyResponse = {
  features?: unknown
}

export const fetchLocations = async ( category = 'catering.cafe', limit = 5 ) => {
 
  // Searches for locations in a bounding box around the CBD
  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=rect:174.73402155444433,-36.840352394480576,174.79018430176848,-36.88354209657474&limit=${limit}&apiKey=${process.env.GEOAPIFY_KEY}`
  
  try {
    const res = await fetch( url );

    if (!res.ok) {
      throw new Error( `Geoapify error: ${res.status}` );
    }

    const data = await res.json() as GeoapifyResponse;

    // The test suite covers malformed Geoapify payloads explicitly. Validating
    // the shape here prevents downstream mappers from failing with unclear
    // property-access errors when the external API returns unexpected JSON.
    if (typeof data !== 'object' || data === null || !Array.isArray(data.features)) {
      throw new Error('Geoapify response missing features array')
    }
    
    return data.features;

  } catch (err) {
      console.error( "Geoapify fetch failed:", err );
      throw err;
  }

};

export const addLocations = async ( category = 'catering.cafe', limit = 3 ) => {
    // Based on the seeded location records, the catergories would be 'catering.cafe', 'lesiure.park' and 'sports.fitness_centre'

    const places = await fetchLocations( category, limit ) ;
    const data = [];

    for ( let place of places ) {
        data.push(mapPlace( place, category ));
    }

    // Empty API responses are valid and should not create a pointless database
    // call. Unit tests assert the service returns a createMany-like count object
    // so callers can handle empty imports the same way as successful imports.
    if (data.length === 0) {
      return { count: 0 }
    }

    return createLocations( data );
    
}


