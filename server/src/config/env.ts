// ============================================================
// GymFuel — Environment Variable Validation
// Uses Zod to parse and validate all env vars at server startup.
// If any required variable is missing or malformed → server refuses
// to start with a clear error message (not a cryptic crash later).
// ============================================================

import { z } from 'zod';
import 'dotenv/config';

const envSchema = z.object({
  // ── Application ───────────────────────────────────────────
  NODE_ENV: z.enum(['development', 'production', 'test'], {
    errorMap: () => ({
      message: 'NODE_ENV must be development, production, or test',
    }),
  }),
  PORT: z.coerce.number().int().min(1024).max(65535).default(5000),

  // ── Database ──────────────────────────────────────────────
  MONGO_URI: z.string().min(1, 'MONGO_URI is required'),
  REDIS_URI: z
    .string()
    .min(1, 'REDIS_URI is required')
    .default('redis://localhost:6379'),

  // ── JWT ───────────────────────────────────────────────────
  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must be at least 32 characters for security'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  ADMIN_JWT_SECRET: z
    .string()
    .min(32, 'ADMIN_JWT_SECRET must be at least 32 characters')
    .optional(),
  ADMIN_JWT_EXPIRES_IN: z.string().default('8h'),

  // ── Firebase ──────────────────────────────────────────────
  FIREBASE_PROJECT_ID: z.string().min(1, 'FIREBASE_PROJECT_ID is required'),
  FIREBASE_CLIENT_EMAIL: z
    .string()
    .email('FIREBASE_CLIENT_EMAIL must be a valid email'),
  FIREBASE_PRIVATE_KEY: z.string().min(1, 'FIREBASE_PRIVATE_KEY is required'),

  // ── Cloudinary ────────────────────────────────────────────
  CLOUDINARY_CLOUD_NAME: z.string().min(1, 'CLOUDINARY_CLOUD_NAME is required'),
  CLOUDINARY_API_KEY: z.string().min(1, 'CLOUDINARY_API_KEY is required'),
  CLOUDINARY_API_SECRET: z.string().min(1, 'CLOUDINARY_API_SECRET is required'),

  // ── Gemini AI ─────────────────────────────────────────────
  GEMINI_API_KEY: z.string().min(1, 'GEMINI_API_KEY is required'),

  // ── Web Push (VAPID) ──────────────────────────────────────
  VAPID_PUBLIC_KEY: z.string().min(1, 'VAPID_PUBLIC_KEY is required'),
  VAPID_PRIVATE_KEY: z.string().min(1, 'VAPID_PRIVATE_KEY is required'),
  VAPID_EMAIL: z
    .string()
    .email('VAPID_EMAIL must be a valid email (e.g. mailto:admin@gymfuel.com)'),

  // ── Email (SMTP) ──────────────────────────────────────────
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.coerce.number().int().default(587),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  SMTP_FROM: z.string().default('GymFuel <noreply@gymfuel.com>'),

  // ── External APIs ─────────────────────────────────────────
  USDA_API_KEY: z.string().optional(),
  NUTRITIONIX_APP_ID: z.string().optional(),
  NUTRITIONIX_APP_KEY: z.string().optional(),

  // ── CORS ──────────────────────────────────────────────────
  CORS_ORIGINS: z
    .string()
    .default(
      'http://localhost:5173,http://localhost:5174,http://localhost:5175',
    ),

  // ── Rate Limiting ─────────────────────────────────────────
  RATE_LIMIT_MAX: z.coerce.number().int().min(1).default(100),

  // ── Logging ───────────────────────────────────────────────
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'http', 'debug']).default('info'),
});

/** Parse and validate all environment variables.
 *  Throws a ZodError with clear messages if any required var is missing/invalid.
 */
function validateEnv() {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const { fieldErrors } = result.error.flatten();
    const messages = Object.entries(fieldErrors)
      .map(([field, errors]) => `  ❌ ${field}: ${errors?.join(', ')}`)
      .join('\n');

    console.error('\n🚨 Invalid environment variables:\n' + messages + '\n');
    console.error(
      '👉 Copy .env.example to .env and fill in all required values.\n',
    );
    process.exit(1);
  }

  return result.data;
}

export const env = validateEnv();

/** Parsed CORS origins as an array */
export const corsOrigins = env.CORS_ORIGINS.split(',').map((o) => o.trim());
