import { Router } from 'express';
import { fetchAndCreateLocations, fetchPlaces } from '../controllers/locationController';

const router = Router();

router.get('/create', fetchAndCreateLocations);
router.get('/fetch', fetchPlaces)

export default router;


