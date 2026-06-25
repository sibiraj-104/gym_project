// ============================================================
// GymFuel — Global Error Handler Middleware
// Express 5 supports async errors natively — all unhandled errors
// from controllers flow here via next(err) or thrown exceptions.
//
// Rules:
//   - NEVER expose stack traces to the client in production
//   - ALWAYS log full error details server-side
//   - ALWAYS return consistent JSON error shape
// ============================================================

import type { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';
import { logger } from '../config/logger';

/** Standard error response shape */
interface ErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
    requestId?: string;
  };
}

/** Custom application error class */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.code = code ?? httpStatusToCode(statusCode);
    this.isOperational = true; // Distinguishes from programming errors
    Error.captureStackTrace(this, this.constructor);
  }
}

/** Common pre-built errors */
export const Errors = {
  unauthorized: (msg = 'Authentication required') =>
    new AppError(msg, 401, 'UNAUTHORIZED'),

  forbidden: (msg = 'Access denied') => new AppError(msg, 403, 'FORBIDDEN'),

  notFound: (resource = 'Resource') =>
    new AppError(`${resource} not found`, 404, 'NOT_FOUND'),

  badRequest: (msg: string) => new AppError(msg, 400, 'BAD_REQUEST'),

  conflict: (msg: string) => new AppError(msg, 409, 'CONFLICT'),

  tooManyRequests: (msg = 'Too many requests. Please slow down.') =>
    new AppError(msg, 429, 'RATE_LIMITED'),

  internal: (msg = 'An internal error occurred') =>
    new AppError(msg, 500, 'INTERNAL_ERROR'),
};

/** Map HTTP status codes to semantic error codes */
function httpStatusToCode(status: number): string {
  const map: Record<number, string> = {
    400: 'BAD_REQUEST',
    401: 'UNAUTHORIZED',
    403: 'FORBIDDEN',
    404: 'NOT_FOUND',
    409: 'CONFLICT',
    422: 'UNPROCESSABLE',
    429: 'RATE_LIMITED',
    500: 'INTERNAL_ERROR',
    502: 'BAD_GATEWAY',
    503: 'SERVICE_UNAVAILABLE',
  };
  return map[status] ?? 'ERROR';
}

/** The global error handler — must have 4 parameters for Express to recognize it */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _next: NextFunction,
): void {
  const requestId = req.headers['x-request-id'] as string | undefined;
  const isProd = process.env.NODE_ENV === 'production';

  // ── ZodError (validation failures) ────────────────────────
  if (err instanceof ZodError) {
    const details = err.flatten().fieldErrors;
    logger.warn('Validation error', {
      url: req.url,
      method: req.method,
      details,
    });

    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Request validation failed. Check the details field.',
        details: isProd ? undefined : details,
        requestId,
      },
    };
    res.status(400).json(response);
    return;
  }

  // ── AppError (operational errors) ─────────────────────────
  if (err instanceof AppError) {
    if (err.statusCode >= 500) {
      logger.error('Operational error', {
        code: err.code,
        message: err.message,
        url: req.url,
        method: req.method,
        stack: err.stack,
        requestId,
      });
    } else {
      logger.warn('Client error', {
        code: err.code,
        message: err.message,
        url: req.url,
        method: req.method,
        requestId,
      });
    }

    const response: ErrorResponse = {
      success: false,
      error: {
        code: err.code,
        message: err.message,
        requestId,
      },
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // ── MongoDB duplicate key error ────────────────────────────
  if (
    (err as NodeJS.ErrnoException).name === 'MongoServerError' &&
    (err as { code?: number }).code === 11000
  ) {
    logger.warn('Duplicate key error', { url: req.url, message: err.message });
    const response: ErrorResponse = {
      success: false,
      error: {
        code: 'CONFLICT',
        message: 'This record already exists.',
        requestId,
      },
    };
    res.status(409).json(response);
    return;
  }

  // ── Unknown / programming errors ───────────────────────────
  logger.error('Unhandled error', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    requestId,
  });

  const response: ErrorResponse = {
    success: false,
    error: {
      code: 'INTERNAL_ERROR',
      message: isProd
        ? 'An unexpected error occurred. Please try again.'
        : err.message,
      requestId,
    },
  };
  res.status(500).json(response);
}
