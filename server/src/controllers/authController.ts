import type { Request, Response } from 'express';
import { z } from 'zod';
import { User } from '../models/User';
import { verifyGoogleToken, generateJWT } from '../utils/token';
import { Errors } from '../middleware/errorHandler';
import { env } from '../config/env';
import { UserRole } from 'gymfuel-shared';

const googleLoginSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

/**
 * Handles Google One-Tap authentication.
 * Verifies Firebase ID Token, logs/registers the user, and sets secure JWT cookie.
 *
 * POST /api/auth/google
 */
export async function googleOneTapLogin(
  req: Request,
  res: Response,
): Promise<void> {
  const { token } = googleLoginSchema.parse(req.body);

  let googleUser;
  try {
    googleUser = await verifyGoogleToken(token);
  } catch (err: unknown) {
    const errMsg =
      err instanceof Error ? err.message : 'Google token verification failed';
    throw Errors.unauthorized(`Invalid Google Token: ${errMsg}`);
  }

  const { uid, email, name } = googleUser;

  // 1. Try to find user by googleId
  let user = await User.findOne({ googleId: uid });

  if (!user) {
    // 2. Fallback: search by email to link existing user
    user = await User.findOne({ email });

    if (user) {
      // Link Google authentication to the existing account
      user.googleId = uid;
      user.lastActiveAt = new Date();
      await user.save();
    } else {
      // 3. Register a new user
      user = await User.create({
        name,
        email,
        googleId: uid,
        role: UserRole.USER,
        isOnboarded: false,
        streakCount: 0,
        lastActiveAt: new Date(),
      });
    }
  } else {
    // Update last active timestamp
    user.lastActiveAt = new Date();
    await user.save();
  }

  // 4. Check if user is banned
  if (user.bannedAt) {
    throw Errors.forbidden(
      `Your account has been banned. Reason: ${user.bannedReason || 'No reason provided'}`,
    );
  }

  // 5. Generate custom App JWT
  const appToken = generateJWT(user.id, user.role);

  // 6. Set httpOnly cookie
  res.cookie('token', appToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  // 7. Respond with user profile details
  res.status(200).json({
    message: 'Authentication successful',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      profile: user.profile,
      goals: user.goals,
      streakCount: user.streakCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

/**
 * Handles user logout.
 * Clears the session cookie.
 *
 * POST /api/auth/logout
 */
export async function logoutUser(_req: Request, res: Response): Promise<void> {
  res.clearCookie('token', {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
  });

  res.status(200).json({
    message: 'Logged out successfully',
  });
}
