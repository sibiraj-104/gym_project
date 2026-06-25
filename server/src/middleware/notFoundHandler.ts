// ============================================================
// GymFuel — 404 Not Found Handler
// Must be registered AFTER all routes. Catches any request
// that didn't match a defined route.
// ============================================================

import type { Request, Response, NextFunction } from 'express';

export function notFoundHandler(
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] as string | undefined;

  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
      requestId,
    },
  });
}
