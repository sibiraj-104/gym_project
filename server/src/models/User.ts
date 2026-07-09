// ============================================================
// GymFuel — User Mongoose Model
// Maps to the `users` MongoDB collection.
// Implements the IUser interface from gymfuel-shared.
//
// Security rules:
//   - passwordHash is NEVER returned in queries (select: false)
//   - googleId is excluded from public API responses
//   - email and googleId have unique indexes
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { UserRole, ActivityLevel, FitnessGoal, Gender } from 'gymfuel-shared';

// ── Embedded sub-document interfaces ────────────────────────

export interface IUserProfile {
  age: number;
  weight: number; // kg
  height: number; // cm
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface IUserGoals {
  type: FitnessGoal;
  targetCalories: number;
  targetProtein: number; // grams
  targetCarbs: number; // grams
  targetFat: number; // grams
  targetWaterGlasses: number;
}

// ── Main document interface ──────────────────────────────────

export interface IUserDocument extends Document {
  name: string;
  email: string;
  googleId?: string;
  passwordHash?: string; // bcrypt hash — never plain text
  role: UserRole;
  profile?: IUserProfile;
  goals?: IUserGoals;
  isOnboarded: boolean;
  streakCount: number;
  lastActiveAt: Date;
  bannedAt?: Date;
  bannedReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Profile sub-schema ───────────────────────────────────────

const userProfileSchema = new Schema<IUserProfile>(
  {
    age: { type: Number, required: true, min: 13, max: 120 },
    weight: { type: Number, required: true, min: 20, max: 500 }, // kg
    height: { type: Number, required: true, min: 50, max: 300 }, // cm
    gender: {
      type: String,
      required: true,
      enum: Object.values(Gender),
    },
    activityLevel: {
      type: String,
      required: true,
      enum: Object.values(ActivityLevel),
    },
  },
  { _id: false }, // No separate _id for embedded docs
);

// ── Goals sub-schema ─────────────────────────────────────────

const userGoalsSchema = new Schema<IUserGoals>(
  {
    type: {
      type: String,
      required: true,
      enum: Object.values(FitnessGoal),
    },
    targetCalories: { type: Number, required: true, min: 500, max: 10000 },
    targetProtein: { type: Number, required: true, min: 0 },
    targetCarbs: { type: Number, required: true, min: 0 },
    targetFat: { type: Number, required: true, min: 0 },
    targetWaterGlasses: { type: Number, required: true, min: 1, max: 20 },
  },
  { _id: false },
);

// ── Main User schema ─────────────────────────────────────────

const userSchema = new Schema<IUserDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 60,
    },

    email: {
      type: String,
      required: true,
      unique: true, // Enforced at DB level
      lowercase: true,
      trim: true,
    },

    // Google OAuth — only present for Google-authenticated users
    googleId: {
      type: String,
      sparse: true, // Unique index but allows multiple nulls
      unique: true,
    },

    // bcrypt hash — NEVER plain text, NEVER sent to client
    passwordHash: {
      type: String,
      select: false, // Excluded from ALL queries unless explicitly requested
    },

    role: {
      type: String,
      enum: Object.values(UserRole),
      default: UserRole.USER,
    },

    // Populated after onboarding step 1 & 2
    profile: { type: userProfileSchema, default: undefined },

    // Populated after onboarding step 3 (TDEE calculation)
    goals: { type: userGoalsSchema, default: undefined },

    // Set to true after PUT /api/user/onboarding completes
    isOnboarded: { type: Boolean, default: false },

    // Incremented each day the user logs at least one meal
    streakCount: { type: Number, default: 0, min: 0 },

    // Updated on every authenticated request
    lastActiveAt: { type: Date, default: Date.now },

    // Ban management (admin only)
    bannedAt: { type: Date },
    bannedReason: { type: String, maxlength: 500 },
  },
  {
    // Auto-manage createdAt and updatedAt
    timestamps: true,

    // Strip unknown fields on save (security)
    strict: true,

    // Use virtual `id` alongside `_id`
    toJSON: {
      virtuals: true,
      versionKey: false,
      transform(_doc, ret) {
        // Never leak passwordHash or googleId in JSON responses
        delete ret.passwordHash;
        delete ret.googleId;
        return ret;
      },
    },
  },
);

// ── Indexes ──────────────────────────────────────────────────

// Compound index for streak and activity queries
userSchema.index({ role: 1, isOnboarded: 1 });
userSchema.index({ lastActiveAt: -1 });

// ── Model export ─────────────────────────────────────────────

// Guard against model re-registration in hot-reload / test environments
export const User =
  (mongoose.models.User as mongoose.Model<IUserDocument>) ??
  mongoose.model<IUserDocument>('User', userSchema);

export default User;
