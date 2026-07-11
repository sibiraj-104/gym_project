import { Router } from 'express';
import { googleOneTapLogin, logoutUser } from '../controllers/authController';

const router = Router();

// POST /api/auth/google - Authenticate using Google ID Token
router.post('/google', googleOneTapLogin);

// POST /api/auth/logout - Log out user and clear cookie
router.post('/logout', logoutUser);

export default router;
