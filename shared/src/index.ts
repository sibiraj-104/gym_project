// ============================================================
// GymFuel Shared Package — Root Export
// Import from 'gymfuel-shared' in any workspace
// ============================================================

// ── Types ──────────────────────────────────────────────────
export * from './types';

// ── Validators (Zod schemas) ────────────────────────────────
export * from './validators';

// ── Constants & Enums ───────────────────────────────────────
export * from './constants';

// ── Legacy (keep for backward compatibility) ─────────────────
import { z } from 'zod';

/** @deprecated Use OnboardingInput from validators/user.schema instead */
export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  uptime: z.number().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;
