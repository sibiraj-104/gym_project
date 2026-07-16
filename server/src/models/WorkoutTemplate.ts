// ============================================================
// GymFuel — WorkoutTemplate Mongoose Model
// Maps to the `workout_templates` MongoDB collection.
// Implements the IWorkoutTemplate interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { MuscleGroup, DifficultyLevel } from 'gymfuel-shared';

// ── Embedded sub-document interfaces ────────────────────────

export interface IWorkoutTemplateExerciseDocument {
  exerciseId: mongoose.Types.ObjectId;
  exerciseName: string;
  sets: number;
  repsRange: string;
  restSeconds: number;
  notes?: string;
}

// ── Main document interface ──────────────────────────────────

export interface IWorkoutTemplateDocument extends Document {
  name: string;
  description: string;
  difficulty: DifficultyLevel;
  durationWeeks: number;
  daysPerWeek: number;
  exercises: IWorkoutTemplateExerciseDocument[];
  targetMuscles: MuscleGroup[];
  createdByAdminId: mongoose.Types.ObjectId;
  isPublished: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────

const workoutTemplateExerciseSchema =
  new Schema<IWorkoutTemplateExerciseDocument>(
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
        type: Number,
        required: true,
        min: 1,
      },
      repsRange: {
        type: String,
        required: true,
        trim: true,
      },
      restSeconds: {
        type: Number,
        required: true,
        default: 90,
        min: 0,
      },
      notes: {
        type: String,
        trim: true,
      },
    },
    { _id: false },
  );

// ── Main Schema ──────────────────────────────────────────────

const workoutTemplateSchema = new Schema<IWorkoutTemplateDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    difficulty: {
      type: String,
      required: true,
      enum: Object.values(DifficultyLevel),
    },
    durationWeeks: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
    },
    daysPerWeek: {
      type: Number,
      required: true,
      default: 1,
      min: 1,
      max: 7,
    },
    exercises: {
      type: [workoutTemplateExerciseSchema],
      required: true,
      default: [],
    },
    targetMuscles: {
      type: [String],
      enum: Object.values(MuscleGroup),
      default: [],
    },
    createdByAdminId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    isPublished: {
      type: Boolean,
      required: true,
      default: true,
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

// ── Indexes ──────────────────────────────────────────────────

// Index to filter templates by difficulty and target muscles
workoutTemplateSchema.index({ difficulty: 1 });
workoutTemplateSchema.index({ targetMuscles: 1 });

// ── Model Export ─────────────────────────────────────────────

export const WorkoutTemplate =
  (mongoose.models
    .WorkoutTemplate as mongoose.Model<IWorkoutTemplateDocument>) ??
  mongoose.model<IWorkoutTemplateDocument>(
    'WorkoutTemplate',
    workoutTemplateSchema,
  );

export default WorkoutTemplate;
