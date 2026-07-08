// ============================================================
// GymFuel — JWT Authentication Middleware
// Protects routes by verifying the App JWT stored in the
// httpOnly 'token' cookie on every authenticated request.
//
// Flow:
//   1. Read 'token' cookie from request
//   2. Verify signature + expiry via verifyJWT()
//   3. Attach decoded { userId, role } to req.user
//   4. Call next() to let the controller run
//
// On failure → throws 401 Unauthorized (handled by errorHandler)
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { verifyJWT, JwtPayload } from '../utils/token';
import { Errors } from './errorHandler';

// ── Extend Express Request type ───────────────────────────
// Augments the express-serve-static-core module so req.user is
// typed across every controller without needing a global namespace.

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtPayload;
  }
}

// ── Auth Middleware ───────────────────────────────────────────

/**
 * Verifies the JWT stored in the 'token' httpOnly cookie.
 * Attaches the decoded payload to `req.user` on success.
 *
 * Usage:
 *   router.get('/api/user/profile', authMiddleware, profileController);
 */
export function authMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  // Read the JWT from the httpOnly cookie
  const token: string | undefined = req.cookies?.token;

  if (!token) {
    throw Errors.unauthorized('Authentication required. Please log in.');
  }

  try {
    const payload = verifyJWT(token);
    req.user = payload;
    next();
  } catch {
    // Covers TokenExpiredError, JsonWebTokenError, NotBeforeError
    throw Errors.unauthorized(
      'Session expired or invalid. Please log in again.',
    );
  }
}

// ── Optional Auth Middleware ──────────────────────────────────

/**
 * Like authMiddleware but does NOT throw if no token is present.
 * Attaches req.user if valid token found, otherwise req.user is undefined.
 *
 * Useful for routes that show different data for logged-in vs. anonymous users.
 *
 * Usage:
 *   router.get('/api/food/search', optionalAuthMiddleware, searchController);
 */
export function optionalAuthMiddleware(
  req: Request,
  _res: Response,
  next: NextFunction,
): void {
  const token: string | undefined = req.cookies?.token;

  if (token) {
    try {
      req.user = verifyJWT(token);
    } catch {
      // Token present but invalid — ignore silently for optional auth
      req.user = undefined;
    }
  }

  next();
}
