import { Router } from 'express';
import {
  googleOneTapLogin,
  registerUser,
  loginUser,
  logoutUser,
} from '../controllers/authController';

const router = Router();

// POST /api/auth/register - Register using Email + Password
router.post('/register', registerUser);

// POST /api/auth/login - Login using Email + Password
router.post('/login', loginUser);

// POST /api/auth/google - Authenticate using Google ID Token
router.post('/google', googleOneTapLogin);

// POST /api/auth/logout - Log out user and clear cookie
router.post('/logout', logoutUser);

export default router;
