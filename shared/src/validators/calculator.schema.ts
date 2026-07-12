// ============================================================
// GymFuel — Calculator Validators (Zod Schemas)
// ============================================================

import { z } from 'zod';
import { ActivityLevel, FitnessGoal, Gender } from '../types/user.types';

export const tdeeCalcSchema = z.object({
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight cannot exceed 500 kg'),
  height: z
    .number({ required_error: 'Height is required' })
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height cannot exceed 300 cm'),
  age: z
    .number({ required_error: 'Age is required' })
    .int('Age must be a whole number')
    .min(10, 'Must be at least 10 years old')
    .max(120, 'Age cannot exceed 120 years'),
  gender: z.nativeEnum(Gender, {
    errorMap: () => ({ message: 'Please select a valid gender' }),
  }),
  activityLevel: z.nativeEnum(ActivityLevel, {
    errorMap: () => ({ message: 'Please select a valid activity level' }),
  }),
});

export type TDEECalcInput = z.infer<typeof tdeeCalcSchema>;

export const bmiCalcSchema = z.object({
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight cannot exceed 500 kg'),
  height: z
    .number({ required_error: 'Height is required' })
    .min(50, 'Height must be at least 50 cm')
    .max(300, 'Height cannot exceed 300 cm'),
});

export type BMICalcInput = z.infer<typeof bmiCalcSchema>;

export const proteinCalcSchema = z.object({
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(20, 'Weight must be at least 20 kg')
    .max(500, 'Weight cannot exceed 500 kg'),
  goal: z.nativeEnum(FitnessGoal, {
    errorMap: () => ({ message: 'Please select a valid fitness goal' }),
  }),
});

export type ProteinCalcInput = z.infer<typeof proteinCalcSchema>;

export const oneRepMaxCalcSchema = z.object({
  weight: z
    .number({ required_error: 'Weight is required' })
    .min(1, 'Weight must be at least 1 kg')
    .max(1000, 'Weight cannot exceed 1000 kg'),
  reps: z
    .number({ required_error: 'Reps is required' })
    .int('Reps must be a whole number')
    .min(1, 'Reps must be at least 1')
    .max(30, 'Reps cannot exceed 30'),
});

export type OneRepMaxCalcInput = z.infer<typeof oneRepMaxCalcSchema>;
