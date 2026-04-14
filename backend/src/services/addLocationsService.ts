import { fetchPlaces } from '../services/fetchPlacesService';
import { mapPlace } from '../utils/mapPlaces';

// Doesn't add the locations to database yet
export const addLocations = async () => {
    const places = await fetchPlaces() ;
    const data = [];

    for (let place of places) {
        data.push(mapPlace( place ));
    }
    
    return data;

}