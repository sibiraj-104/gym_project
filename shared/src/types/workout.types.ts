// ============================================================
// GymFuel — Workout & Exercise Types
// Exercise library, workout logs, workout templates
// ============================================================

export enum MuscleGroup {
  CHEST = 'chest',
  BACK = 'back',
  SHOULDERS = 'shoulders',
  BICEPS = 'biceps',
  TRICEPS = 'triceps',
  FOREARMS = 'forearms',
  CORE = 'core',
  QUADS = 'quads',
  HAMSTRINGS = 'hamstrings',
  GLUTES = 'glutes',
  CALVES = 'calves',
  FULL_BODY = 'full_body',
  CARDIO = 'cardio',
}

export enum Equipment {
  BARBELL = 'barbell',
  DUMBBELL = 'dumbbell',
  CABLE = 'cable',
  MACHINE = 'machine',
  BODYWEIGHT = 'bodyweight',
  KETTLEBELL = 'kettlebell',
  RESISTANCE_BAND = 'resistance_band',
  PULL_UP_BAR = 'pull_up_bar',
  BENCH = 'bench',
  NONE = 'none',
}

export enum DifficultyLevel {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

export interface IExercise {
  _id: string;
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  difficulty: DifficultyLevel;
  instructions: string[]; // Step-by-step instructions
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean; // User-created vs admin-added
  createdAt: string;
}

export interface IWorkoutSet {
  setNumber: number;
  reps?: number;
  weight?: number; // in kg
  durationSeconds?: number; // For timed exercises (planks, etc.)
  restSeconds?: number;
  isWarmup: boolean;
  rpe?: number; // Rate of Perceived Exertion (1–10)
}

export interface IWorkoutExerciseLog {
  exerciseId: string;
  exerciseName: string; // Denormalized
  sets: IWorkoutSet[];
  notes?: string;
}

export interface IWorkoutLog {
  _id: string;
  userId: string;
  name?: string; // "Chest Day", "Full Body", etc.
  exercises: IWorkoutExerciseLog[];
  durationMinutes: number;
  totalVolume: number; // Sum of (sets × reps × weight)
  caloriesBurned?: number;
  notes?: string;
  startedAt: string;
  completedAt: string;
  createdAt: string;
}

export interface IWorkoutTemplateExercise {
  exerciseId: string;
  exerciseName: string;
  sets: number;
  repsRange: string; // e.g., "8–12"
  restSeconds: number;
  notes?: string;
}

export interface IWorkoutTemplate {
  _id: string;
  name: string; // "PPL Program — Push Day"
  description: string;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  daysPerWeek: number;
  exercises: IWorkoutTemplateExercise[];
  targetMuscles: MuscleGroup[];
  createdByAdminId: string;
  isPublished: boolean;
  createdAt: string;
}
