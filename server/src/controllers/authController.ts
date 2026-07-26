import type { Request, Response } from 'express';
import mongoose from 'mongoose';
import { z } from 'zod';
import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { verifyGoogleToken, generateJWT } from '../utils/token';
import { Errors } from '../middleware/errorHandler';
import { env } from '../config/env';
import { UserRole } from 'gymfuel-shared';

const googleLoginSchema = z.object({
  token: z.string().min(1, 'Token is required'),
});

const registerSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(60, 'Name must be at most 60 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

/**
 * Handles traditional email/password user registration.
 *
 * POST /api/auth/register
 */
export async function registerUser(req: Request, res: Response): Promise<void> {
  const { name, email, password } = registerSchema.parse(req.body);

  // Dev fallback if database is disconnected
  if (mongoose.connection.readyState !== 1 && env.NODE_ENV === 'development') {
    const mockUserId = '660000000000000000000001';
    const appToken = generateJWT(mockUserId, UserRole.USER);
    res.cookie('token', appToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: mockUserId,
        name,
        email,
        role: UserRole.USER,
        isOnboarded: true,
        streakCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return;
  }

  // 1. Check if user already exists
  const existingUser = await User.findOne({ email });
  if (existingUser) {
    throw Errors.conflict('A user with this email address already exists.');
  }

  // 2. Hash the password
  const passwordHash = await bcrypt.hash(password, 10);

  // 3. Create the user
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: UserRole.USER,
    isOnboarded: false,
    streakCount: 0,
    lastActiveAt: new Date(),
  });

  // 4. Generate App JWT
  const appToken = generateJWT(user.id, user.role);

  // 5. Set cookie
  res.cookie('token', appToken, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in ms
  });

  // 6. Respond
  res.status(201).json({
    message: 'Registration successful',
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
 * Handles traditional email/password login.
 *
 * POST /api/auth/login
 */
export async function loginUser(req: Request, res: Response): Promise<void> {
  const { email, password } = loginSchema.parse(req.body);

  // Dev fallback if database is disconnected
  if (mongoose.connection.readyState !== 1 && env.NODE_ENV === 'development') {
    const mockUserId = '660000000000000000000001';
    const appToken = generateJWT(mockUserId, UserRole.USER);
    res.cookie('token', appToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: 'Login successful',
      user: {
        id: mockUserId,
        name: 'Demo User',
        email,
        role: UserRole.USER,
        isOnboarded: true,
        streakCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return;
  }

  // 1. Find user, explicitly selecting passwordHash
  const user = await User.findOne({ email }).select('+passwordHash');
  if (!user || !user.passwordHash) {
    throw Errors.unauthorized('Invalid email or password.');
  }

  // 2. Verify password hash
  const isMatch = await bcrypt.compare(password, user.passwordHash);
  if (!isMatch) {
    throw Errors.unauthorized('Invalid email or password.');
  }

  // 3. Check if user is banned
  if (user.bannedAt) {
    throw Errors.forbidden(
      `Your account has been banned. Reason: ${user.bannedReason || 'No reason provided'}`,
    );
  }

  // 4. Update last active timestamp
  user.lastActiveAt = new Date();
  await user.save();

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
    message: 'Login successful',
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

  // Dev fallback if database is disconnected or dev mock token is used
  if (
    (token === 'mock_google_id_token_dev' ||
      mongoose.connection.readyState !== 1) &&
    env.NODE_ENV === 'development'
  ) {
    const mockUserId = '660000000000000000000001';
    const appToken = generateJWT(mockUserId, UserRole.USER);
    res.cookie('token', appToken, {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    res.status(200).json({
      message: 'Google login successful',
      user: {
        id: mockUserId,
        name: 'Google User',
        email: 'googleuser@gymfuel.com',
        role: UserRole.USER,
        isOnboarded: true,
        streakCount: 5,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    });
    return;
  }

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
