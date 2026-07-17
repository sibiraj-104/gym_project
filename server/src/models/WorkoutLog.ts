// ============================================================
// GymFuel — WorkoutLog Mongoose Model
// Maps to the `workout_logs` MongoDB collection.
// Implements the IWorkoutLog interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';

// ── Embedded sub-document interfaces ────────────────────────

export interface IWorkoutSetDocument {
  setNumber: number;
  reps?: number;
  weight?: number; // in kg
  durationSeconds?: number;
  restSeconds?: number;
  isWarmup: boolean;
  rpe?: number; // Rate of Perceived Exertion (1–10)
}

export interface IWorkoutExerciseLogDocument {
  exerciseId: mongoose.Types.ObjectId;
  exerciseName: string;
  sets: IWorkoutSetDocument[];
  notes?: string;
}

// ── Main document interface ──────────────────────────────────

export interface IWorkoutLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  name?: string;
  exercises: IWorkoutExerciseLogDocument[];
  durationMinutes: number;
  totalVolume: number;
  caloriesBurned?: number;
  notes?: string;
  startedAt: Date;
  completedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────

const workoutSetSchema = new Schema<IWorkoutSetDocument>(
  {
    setNumber: { type: Number, required: true, min: 1 },
    reps: { type: Number, min: 0 },
    weight: { type: Number, min: 0 },
    durationSeconds: { type: Number, min: 0 },
    restSeconds: { type: Number, min: 0 },
    isWarmup: { type: Boolean, required: true, default: false },
    rpe: { type: Number, min: 1, max: 10 },
  },
  { _id: false },
);

const workoutExerciseLogSchema = new Schema<IWorkoutExerciseLogDocument>(
  {
    exerciseId: {
      type: Schema.Types.ObjectId,
      ref: 'Exercise',
      required: true,
    },
    exerciseName: {
      type: String,
      required: true,
      trim: true,
    },
    sets: {
      type: [workoutSetSchema],
      required: true,
      default: [],
    },
    notes: {
      type: String,
      trim: true,
    },
  },
  { _id: false },
);

// ── Main Schema ──────────────────────────────────────────────

const workoutLogSchema = new Schema<IWorkoutLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      trim: true,
      default: 'Workout',
    },
    exercises: {
      type: [workoutExerciseLogSchema],
      required: true,
      default: [],
    },
    durationMinutes: {
      type: Number,
      required: true,
      min: 0,
    },
    totalVolume: {
      type: Number,
      required: true,
      default: 0,
    },
    caloriesBurned: {
      type: Number,
      min: 0,
    },
    notes: {
      type: String,
      trim: true,
    },
    startedAt: {
      type: Date,
      required: true,
    },
    completedAt: {
      type: Date,
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    toJSON: {
      virtuals: true,
      versionKey: false,
    },
  },
);

// ── Mongoose Middleware ──────────────────────────────────────

// Pre-save hook to calculate total volume: sum of (reps * weight) for all non-warmup/all sets
workoutLogSchema.pre('save', function (next) {
  let volume = 0;
  if (this.exercises && Array.isArray(this.exercises)) {
    for (const exercise of this.exercises) {
      if (exercise.sets && Array.isArray(exercise.sets)) {
        for (const set of exercise.sets) {
          if (set.reps && set.weight) {
            volume += set.reps * set.weight;
          }
        }
      }
    }
  }
  this.totalVolume = volume;
  next();
});

// ── Indexes ──────────────────────────────────────────────────

// Index to query user logs by date/recency
workoutLogSchema.index({ userId: 1, startedAt: -1 });

// ── Model Export ─────────────────────────────────────────────

export const WorkoutLog =
  (mongoose.models.WorkoutLog as mongoose.Model<IWorkoutLogDocument>) ??
  mongoose.model<IWorkoutLogDocument>('WorkoutLog', workoutLogSchema);

export default WorkoutLog;
