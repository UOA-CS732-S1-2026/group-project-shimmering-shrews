import { Router } from 'express';
import { fetchAndCreateLocations } from '../controllers/locationsController';

const router = Router();

router.get('/', fetchAndCreateLocations);

export default router;


