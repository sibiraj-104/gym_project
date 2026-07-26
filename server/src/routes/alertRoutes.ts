import { Router } from 'express';
import { authenticateUser } from '../middleware/auth';
import { configureAlerts, getUserAlerts } from '../controllers/alertController';

const router = Router();

// Apply auth middleware to protect all alerts configuration endpoints
router.use(authenticateUser);

// POST /api/nutrition/alerts — Configure/update alert rules
router.post('/alerts', configureAlerts);

// GET /api/nutrition/alerts — Get configured alert rules
router.get('/alerts', getUserAlerts);

export default router;
