// ============================================================
// GymFuel — Meal Logging Routes
// Defines routes for meal logging, summaries, history, and entry
// deletions protected by authentication middleware.
// ============================================================

import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  logMeal,
  getTodayLog,
  getMealHistory,
  deleteMealEntry,
} from '../controllers/mealController';

const router = Router();

// Protect all routes under /api/meals
router.use(authMiddleware);

// POST /api/meals/log
router.post('/log', logMeal);

// GET /api/meals/log/today
router.get('/log/today', getTodayLog);

// GET /api/meals/log/history
router.get('/log/history', getMealHistory);

// DELETE /api/meals/log/entry
router.delete('/log/entry', deleteMealEntry);

export default router;
export const mealRoutes = router;
