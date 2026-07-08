// ============================================================
// GymFuel — Role-Based Access Control (RBAC) Middleware
// A middleware factory that restricts route access based on
// the authenticated user's role.
//
// MUST be used AFTER authMiddleware — it relies on req.user
// being populated by authMiddleware.
//
// Usage:
//   router.delete(
//     '/api/admin/users/:id',
//     authMiddleware,
//     requireRole(UserRole.ADMIN),
//     deleteUserController,
//   );
//
//   // Allow multiple roles:
//   router.patch(
//     '/api/admin/users/:id/ban',
//     authMiddleware,
//     requireRole(UserRole.ADMIN, UserRole.SUPPORT),
//     banUserController,
//   );
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { UserRole } from 'gymfuel-shared';
import { Errors } from './errorHandler';

/**
 * Middleware factory that allows only the specified roles.
 * Throws 403 Forbidden if the authenticated user's role is not in the list.
 *
 * @param allowedRoles - One or more roles that are permitted to access the route
 */
export function requireRole(...allowedRoles: UserRole[]) {
  return function rbacMiddleware(
    req: Request,
    _res: Response,
    next: NextFunction,
  ): void {
    // req.user must be set by authMiddleware before this runs
    if (!req.user) {
      throw Errors.unauthorized('Authentication required.');
    }

    const { role } = req.user;

    if (!allowedRoles.includes(role)) {
      throw Errors.forbidden(
        `Access denied. Required role: ${allowedRoles.join(' or ')}. Your role: ${role}`,
      );
    }

    next();
  };
}

/**
 * Convenience shorthand — admin-only routes.
 *
 * Usage:
 *   router.get('/api/admin/users', authMiddleware, adminOnly, controller);
 */
export const adminOnly = requireRole(UserRole.ADMIN);

/**
 * Convenience shorthand — admin + support routes
 * (e.g. ban user — support agents can ban, but not delete).
 *
 * Usage:
 *   router.patch('/api/admin/users/:id/ban', authMiddleware, adminOrSupport, controller);
 */
export const adminOrSupport = requireRole(UserRole.ADMIN, UserRole.SUPPORT);
