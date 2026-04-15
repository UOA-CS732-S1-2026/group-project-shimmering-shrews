import { mapPlace } from '../utils/mapPlaces';
import { createLocations } from '../daos/locationDao'

export const fetchPlaces = async () => {

  // Based on the current location entries, they would correlate to 'catering.cafe', 'lesiure.park' and 'sports.fitness_centre'
  const category = 'catering.cafe';
  const limit = 3;
  // Searches for locations in a bounding box around the CBD
  const url = `https://api.geoapify.com/v2/places?categories=${category}&filter=rect:174.73402155444433,-36.840352394480576,174.79018430176848,-36.88354209657474&limit=${limit}&apiKey=${process.env.GEOAPIFY_KEY}`
  
  try {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`Geoapify error: ${res.status}`);
    }

    const data = await res.json();
    
    return data.features;

  } catch (err) {
      console.error("Geoapify fetch failed:", err);
      throw err;
  }

};

export const addLocations = async () => {
    const places = await fetchPlaces() ;
    const data = [];

    for (let place of places) {
        data.push(mapPlace( place ));
    }

    return createLocations(data);
    
}


