import { z } from 'zod';

export const workoutSetSchema = z.object({
  setNumber: z.number().int().min(1, 'Set number must be at least 1'),
  reps: z.number().int().min(0).optional(),
  weight: z.number().min(0).optional(),
  durationSeconds: z.number().int().min(0).optional(),
  restSeconds: z.number().int().min(0).optional(),
  isWarmup: z.boolean().default(false),
  rpe: z.number().int().min(1).max(10).optional(),
});

export const workoutExerciseLogSchema = z.object({
  exerciseId: z
    .string()
    .regex(/^[0-9a-fA-F]{24}$/, 'Invalid exercise ID format'),
  exerciseName: z.string().min(1, 'Exercise name is required'),
  sets: z.array(workoutSetSchema).min(1, 'At least one set is required'),
  notes: z.string().optional(),
});

export const logWorkoutSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  exercises: z
    .array(workoutExerciseLogSchema)
    .min(1, 'At least one exercise is required'),
  durationMinutes: z.number().min(0, 'Duration cannot be negative'),
  caloriesBurned: z.number().min(0).optional(),
  notes: z.string().optional(),
  startedAt: z.string().datetime({ message: 'Invalid start time format' }),
  completedAt: z
    .string()
    .datetime({ message: 'Invalid completion time format' }),
});

export type WorkoutSetInput = z.infer<typeof workoutSetSchema>;
export type WorkoutExerciseLogInput = z.infer<typeof workoutExerciseLogSchema>;
export type LogWorkoutInput = z.infer<typeof logWorkoutSchema>;
