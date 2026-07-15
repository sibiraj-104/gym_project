import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import { configureAlerts, getUserAlerts } from '../controllers/alertController';

const router = Router();

// Apply auth middleware to protect all alerts configuration endpoints
router.use(authMiddleware);

// POST /api/nutrition/alerts — Configure/update alert rules
router.post('/alerts', configureAlerts);

// GET /api/nutrition/alerts — Get configured alert rules
router.get('/alerts', getUserAlerts);

export default router;
