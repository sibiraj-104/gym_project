// ============================================================
// GymFuel — Auth Types
// JWT payloads, token responses, API response wrappers
// ============================================================

import type { UserRole } from './user.types';

/** The payload encoded inside every App JWT */
export interface IJwtPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number; // Issued at (Unix timestamp)
  exp?: number; // Expiry (Unix timestamp)
}

/** What the backend returns on successful login */
export interface ITokenResponse {
  accessToken: string;
  expiresIn: number; // Seconds until expiry
  tokenType: 'Bearer';
}

/** Standard success API response wrapper */
export interface IApiResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

/** Standard error API response wrapper */
export interface IApiError {
  success: false;
  error: {
    code: string; // e.g. 'UNAUTHORIZED', 'NOT_FOUND', 'VALIDATION_ERROR'
    message: string; // Human-readable message
    details?: unknown; // Zod validation errors, etc.
  };
}

/** Union type for all API responses */
export type ApiResponse<T = unknown> = IApiResponse<T> | IApiError;

/** Pagination wrapper */
export interface IPaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}
