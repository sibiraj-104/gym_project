import { Router } from 'express';
import {
  getUserProfile,
  updateOnboarding,
} from '../controllers/userController';
import { authMiddleware } from '../middleware/auth';

const router = Router();

// GET /api/user/profile - Get profile details (authenticated)
router.get('/profile', authMiddleware, getUserProfile);

// PUT /api/user/onboarding - Complete onboarding stats & goal setup (authenticated)
router.put('/onboarding', authMiddleware, updateOnboarding);

export default router;
