// ============================================================
// GymFuel — Express Request Type Augmentation
// Extends the Express Request interface globally so that
// req.user is typed across every controller in the server.
//
// This is the pattern recommended by @types/express:
//   https://github.com/DefinitelyTyped/DefinitelyTyped/tree/master/types/express
//
// The ESLint no-namespace rule is disabled here because this
// is the ONLY correct way to extend Express.Request globally.
// ============================================================

import type { UserRole } from 'gymfuel-shared';

declare global {
  namespace Express {
    interface Request {
      /** Decoded JWT payload — populated by authMiddleware */
      user?: {
        userId: string;
        role: UserRole;
        iat?: number;
        exp?: number;
      };
    }
  }
}

// export {} makes this file a module, which is required for
// 'declare global' to work correctly in a non-ambient file.
export {};
