import { Router } from 'express';
import { fetchAndCreateLocations, fetchPlaces } from '../controllers/locationsController';

const router = Router();

router.get('/create', fetchAndCreateLocations);
router.get('/fetch', fetchPlaces)

export default router;


