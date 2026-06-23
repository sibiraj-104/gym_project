import { z } from 'zod';

// Health check schema
export const HealthCheckResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string(),
  uptime: z.number().optional(),
});

export type HealthCheckResponse = z.infer<typeof HealthCheckResponseSchema>;

// Onboarding data schema (Milestone 2 alignment)
export const OnboardingSchema = z.object({
  age: z.number().min(10).max(120),
  weight: z.number().min(30).max(300), // in kg
  height: z.number().min(100).max(250), // in cm
  goal: z.enum(['lose_weight', 'build_muscle', 'maintain_weight']),
});

export type OnboardingData = z.infer<typeof OnboardingSchema>;
