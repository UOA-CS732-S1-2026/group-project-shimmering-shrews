import { Router } from 'express';
import { fetchAndCreateLocations, fetchPlaces } from '../controllers/locationController';

const router = Router();

// Fetches locations from Geoapify and saves new ones to the database.
router.get('/create', fetchAndCreateLocations);

// Fetches locations from Geoapify without saving them — useful for previewing results.
router.get('/fetch', fetchPlaces)

export default router;