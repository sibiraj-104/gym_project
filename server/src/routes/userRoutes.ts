import { Router } from 'express';
import {
  getUserProfile,
  updateOnboarding,
} from '../controllers/userController';
import { authenticateUser } from '../middleware/auth';

const router = Router();

// GET /api/user/profile - Get profile details (authenticated)
router.get('/profile', authenticateUser, getUserProfile);

// PUT /api/user/onboarding - Complete onboarding stats & goal setup (authenticated)
router.put('/onboarding', authenticateUser, updateOnboarding);

export default router;
