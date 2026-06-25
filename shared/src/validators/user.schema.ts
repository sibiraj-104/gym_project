// ============================================================
// GymFuel — User Validators (Zod Schemas)
// Onboarding, profile updates, goal settings
// ============================================================

import { z } from 'zod';
import { ActivityLevel, FitnessGoal, Gender } from '../types/user.types';

// ─── Onboarding Step 1: Body Stats ─────────────────────────────────────────

export const bodyStatsSchema = z.object({
  age: z
    .number({ required_error: 'Age is required' })
    .int('Age must be a whole number')
    .min(10, 'Must be at least 10 years old')
    .max(120, 'Please enter a valid age'),
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Please enter a valid weight'),
  height: z
    .number({ required_error: 'Height is required' })
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Please enter a valid height'),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  activityLevel: z.nativeEnum(ActivityLevel, {
    errorMap: () => ({ message: 'Please select an activity level' }),
  }),
});

export type BodyStatsInput = z.infer<typeof bodyStatsSchema>;

// ─── Onboarding Step 2: Goal Selection ─────────────────────────────────────

export const goalSelectionSchema = z.object({
  goal: z.nativeEnum(FitnessGoal, {
    errorMap: () => ({ message: 'Please select a fitness goal' }),
  }),
});

export type GoalSelectionInput = z.infer<typeof goalSelectionSchema>;

// ─── Full Onboarding (combined) ─────────────────────────────────────────────

export const onboardingSchema = bodyStatsSchema.merge(goalSelectionSchema);

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// ─── Profile Update ─────────────────────────────────────────────────────────

export const profileUpdateSchema = z.object({
  name: z.string().min(2).max(60).trim().optional(),
  profile: bodyStatsSchema.partial().optional(),
  goals: z
    .object({
      type: z.nativeEnum(FitnessGoal).optional(),
      targetCalories: z.number().min(500).max(10000).optional(),
      targetProtein: z.number().min(10).max(500).optional(),
      targetCarbs: z.number().min(10).max(1000).optional(),
      targetFat: z.number().min(10).max(500).optional(),
      targetWaterGlasses: z.number().min(1).max(20).optional(),
    })
    .optional(),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;

// ─── Water Log ──────────────────────────────────────────────────────────────

export const waterLogSchema = z.object({
  glasses: z.number().int().min(1).max(20),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(),
});

export type WaterLogInput = z.infer<typeof waterLogSchema>;
