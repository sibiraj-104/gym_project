// ============================================================
// GymFuel — MealLog Mongoose Model
// Maps to the `meal_logs` MongoDB collection.
// Implements the IMealLog interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { MealType } from 'gymfuel-shared';
import { IMacroNutrientsDocument } from './FoodItem';

// ── Embedded sub-document interfaces ────────────────────────

export interface IMealEntryDocument {
  foodId: string;
  foodName: string;
  mealType: MealType;
  portionGrams: number;
  nutrition: IMacroNutrientsDocument;
  loggedAt: Date;
}

export interface IDailyTotalsDocument {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterGlasses: number;
}

// ── Main document interface ──────────────────────────────────

export interface IMealLogDocument extends Document {
  userId: mongoose.Types.ObjectId;
  date: string; // YYYY-MM-DD
  meals: IMealEntryDocument[];
  totals: IDailyTotalsDocument;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────

const mealEntrySchema = new Schema<IMealEntryDocument>(
  {
    foodId: { type: String, required: true },
    foodName: { type: String, required: true, trim: true },
    mealType: {
      type: String,
      required: true,
      enum: Object.values(MealType),
    },
    portionGrams: { type: Number, required: true, min: 0.1 },
    nutrition: {
      calories: { type: Number, required: true, min: 0 },
      protein: { type: Number, required: true, min: 0 },
      carbs: { type: Number, required: true, min: 0 },
      fat: { type: Number, required: true, min: 0 },
      fiber: { type: Number, min: 0, default: 0 },
      sugar: { type: Number, min: 0, default: 0 },
      sodium: { type: Number, min: 0, default: 0 },
    },
    loggedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const dailyTotalsSchema = new Schema<IDailyTotalsDocument>(
  {
    calories: { type: Number, required: true, min: 0, default: 0 },
    protein: { type: Number, required: true, min: 0, default: 0 },
    carbs: { type: Number, required: true, min: 0, default: 0 },
    fat: { type: Number, required: true, min: 0, default: 0 },
    fiber: { type: Number, required: true, min: 0, default: 0 },
    waterGlasses: { type: Number, required: true, min: 0, max: 50, default: 0 },
  },
  { _id: false },
);

// ── Main Schema ──────────────────────────────────────────────

const mealLogSchema = new Schema<IMealLogDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    date: {
      type: String,
      required: true,
      validate: {
        validator: function (v: string) {
          return /^\d{4}-\d{2}-\d{2}$/.test(v);
        },
        message: (props) =>
          `${props.value} is not a valid date format (YYYY-MM-DD)!`,
      },
    },
    meals: {
      type: [mealEntrySchema],
      default: [],
    },
    totals: {
      type: dailyTotalsSchema,
      required: true,
      default: () => ({}),
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

// Unique compound index: only one log per user per day
mealLogSchema.index({ userId: 1, date: 1 }, { unique: true });

// ── Model Export ─────────────────────────────────────────────

export const MealLog =
  (mongoose.models.MealLog as mongoose.Model<IMealLogDocument>) ??
  mongoose.model<IMealLogDocument>('MealLog', mealLogSchema);

export default MealLog;
