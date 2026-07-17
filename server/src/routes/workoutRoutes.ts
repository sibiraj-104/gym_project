import { Router } from 'express';
import { authMiddleware } from '../middleware/auth';
import {
  getExercises,
  getExerciseById,
  logWorkout,
  getWorkoutHistory,
  getWorkoutTemplates,
  getWorkoutTemplateById,
} from '../controllers/workoutController';

const router = Router();

// Apply auth middleware to protect all workout tracker endpoints
router.use(authMiddleware);

// Exercise endpoints
router.get('/exercises', getExercises);
router.get('/exercises/:id', getExerciseById);

// Log endpoints
router.post('/log', logWorkout);
router.get('/history', getWorkoutHistory);

// Template endpoints
router.get('/templates', getWorkoutTemplates);
router.get('/templates/:id', getWorkoutTemplateById);

export default router;
export const workoutRoutes = router;
