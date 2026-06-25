// ============================================================
// GymFuel — HTTP Request Logger Middleware (Morgan)
// Logs every HTTP request with method, URL, status, response time,
// and user ID (from JWT if authenticated).
// ============================================================

import morgan from 'morgan';
import type { Request, Response } from 'express';
import { morganStream } from '../config/logger';

// ── Request ID middleware ────────────────────────────────────
// Assign a unique ID to every request for log tracing
import { randomUUID } from 'crypto';

export function requestId(req: Request, res: Response, next: () => void): void {
  const id = (req.headers['x-request-id'] as string) ?? randomUUID();
  req.headers['x-request-id'] = id;
  res.setHeader('X-Request-ID', id);
  next();
}

// ── Morgan format token: user ID from JWT ───────────────────
morgan.token('user-id', (req: Request) => {
  // Auth middleware attaches user to req — type-safe access
  const userId = (req as Request & { user?: { userId: string } }).user?.userId;
  return userId ?? 'anonymous';
});

// ── Morgan format token: request ID ─────────────────────────
morgan.token('request-id', (req: Request) => {
  return (req.headers['x-request-id'] as string) ?? '-';
});

// ── Morgan format string ─────────────────────────────────────
// [timestamp] METHOD URL status response-time-ms userId requestId
const morganFormat =
  ':method :url :status :res[content-length]b - :response-time ms | user::user-id | req::request-id';

// ── Skip logging for health check endpoints ──────────────────
// This prevents health check polling from flooding logs
function skipHealthCheck(req: Request): boolean {
  return req.url === '/api/system/health' || req.url === '/healthz';
}

// ── Export configured Morgan instance ────────────────────────
export const requestLogger = morgan(morganFormat, {
  stream: morganStream,
  skip: skipHealthCheck,
});
