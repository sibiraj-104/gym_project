// ============================================================
// GymFuel — JWT Token Utilities
// Centralises all JWT sign/verify logic so the algorithm,
// secret, and expiry are never scattered across controllers.
//
// App JWT    → 7-day lifetime, used by regular users
// Admin JWT  → 8-hour lifetime, used by admin panel
// ============================================================

import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { UserRole } from 'gymfuel-shared';

// ── Token payload shapes ──────────────────────────────────────

export interface JwtPayload {
  userId: string;
  role: UserRole;
  /** Issued at — added automatically by jsonwebtoken */
  iat?: number;
  /** Expiry — added automatically by jsonwebtoken */
  exp?: number;
}

// ── App JWT (regular users) ───────────────────────────────────

/**
 * Sign a 7-day App JWT for a regular user.
 *
 * @param userId  - MongoDB ObjectId string of the user
 * @param role    - The user's role (default: 'user')
 * @returns Signed JWT string
 */
export function generateJWT(
  userId: string,
  role: UserRole = UserRole.USER,
): string {
  return jwt.sign({ userId, role }, env.JWT_SECRET, {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode an App JWT.
 * Throws a JsonWebTokenError / TokenExpiredError on failure.
 *
 * @param token - Raw JWT string (from cookie)
 * @returns Decoded JwtPayload
 */
export function verifyJWT(token: string): JwtPayload {
  const decoded = jwt.verify(token, env.JWT_SECRET, {
    algorithms: ['HS256'], // Reject 'none' algorithm attacks
  });

  return decoded as JwtPayload;
}

// ── Admin JWT (admin panel only) ──────────────────────────────

/**
 * Sign an 8-hour Admin JWT.
 * Uses a separate secret from the user JWT for isolation.
 *
 * @param userId - MongoDB ObjectId string of the admin user
 * @param role   - Must be 'admin', 'support', or 'developer'
 * @returns Signed admin JWT string
 */
export function generateAdminJWT(userId: string, role: UserRole): string {
  const secret = env.ADMIN_JWT_SECRET ?? env.JWT_SECRET;
  const expiresIn = (env.ADMIN_JWT_EXPIRES_IN ??
    '8h') as jwt.SignOptions['expiresIn'];
  return jwt.sign({ userId, role }, secret, {
    expiresIn,
    algorithm: 'HS256',
  });
}

/**
 * Verify and decode an Admin JWT.
 * Throws on invalid signature, expiry, or wrong algorithm.
 *
 * @param token - Raw admin JWT string (from cookie)
 * @returns Decoded JwtPayload
 */
export function verifyAdminJWT(token: string): JwtPayload {
  const secret = env.ADMIN_JWT_SECRET ?? env.JWT_SECRET;
  const decoded = jwt.verify(token, secret, {
    algorithms: ['HS256'],
  });

  return decoded as JwtPayload;
}
