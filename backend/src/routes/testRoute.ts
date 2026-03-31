import { Router } from 'express';
import { getTestDb } from '../controllers/testController';

const router = Router();

router.get('/test-db', getTestDb);

export default router;