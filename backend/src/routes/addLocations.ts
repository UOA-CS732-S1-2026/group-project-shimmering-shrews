import { Router } from 'express';
import { locations } from '../controllers/addLocationsController';

const router = Router();

router.get('/', locations);

export default router;


