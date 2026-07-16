// ============================================================
// GymFuel — Exercise Mongoose Model
// Maps to the `exercises` MongoDB collection.
// Implements the IExercise interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { MuscleGroup, Equipment, DifficultyLevel } from 'gymfuel-shared';

export interface IExerciseDocument extends Document {
  name: string;
  muscleGroup: MuscleGroup;
  secondaryMuscles?: MuscleGroup[];
  equipment: Equipment;
  difficulty: DifficultyLevel;
  instructions: string[];
  videoUrl?: string;
  imageUrl?: string;
  isCustom: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const exerciseSchema = new Schema<IExerciseDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    muscleGroup: {
      type: String,
      required: true,
      enum: Object.values(MuscleGroup),
    },
    secondaryMuscles: {
      type: [String],
      enum: Object.values(MuscleGroup),
      default: [],
    },
    equipment: {
      type: String,
      required: true,
      enum: Object.values(Equipment),
    },
    difficulty: {
      type: String,
      required: true,
      enum: Object.values(DifficultyLevel),
    },
    instructions: {
      type: [String],
      required: true,
      default: [],
    },
    videoUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    isCustom: {
      type: Boolean,
      required: true,
      default: false,
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

// Index for filtering exercises by muscle group
exerciseSchema.index({ muscleGroup: 1 });

// Text index for search functionality on name
exerciseSchema.index({ name: 'text' });

// ── Model Export ─────────────────────────────────────────────

export const Exercise =
  (mongoose.models.Exercise as mongoose.Model<IExerciseDocument>) ??
  mongoose.model<IExerciseDocument>('Exercise', exerciseSchema);

export default Exercise;
