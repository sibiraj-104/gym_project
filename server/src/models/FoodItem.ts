// ============================================================
// GymFuel — FoodItem Mongoose Model
// Maps to the `food_items` MongoDB collection.
// Implements the IFoodItem interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { FoodSource } from 'gymfuel-shared';

// ── Embedded sub-document interfaces ────────────────────────

export interface IMacroNutrientsDocument {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;
}

export interface IVitaminsDocument {
  vitaminA?: number;
  vitaminC?: number;
  vitaminD?: number;
  vitaminE?: number;
  vitaminK?: number;
  vitaminB12?: number;
  folate?: number;
}

export interface IMineralsDocument {
  calcium?: number;
  iron?: number;
  magnesium?: number;
  potassium?: number;
  zinc?: number;
}

// ── Main document interface ──────────────────────────────────

export interface IFoodItemDocument extends Document {
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number; // in grams/ml
  servingUnit: string; // 'g', 'ml', 'piece', etc.
  nutrition: IMacroNutrientsDocument;
  vitamins?: IVitaminsDocument;
  minerals?: IMineralsDocument;
  imageUrl?: string;
  source: FoodSource;
  isApproved: boolean;
  reportCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ──────────────────────────────────────────────

const macroNutrientsSchema = new Schema<IMacroNutrientsDocument>(
  {
    calories: { type: Number, required: true, min: 0 },
    protein: { type: Number, required: true, min: 0 },
    carbs: { type: Number, required: true, min: 0 },
    fat: { type: Number, required: true, min: 0 },
    fiber: { type: Number, min: 0 },
    sugar: { type: Number, min: 0 },
    sodium: { type: Number, min: 0 },
  },
  { _id: false },
);

const vitaminsSchema = new Schema<IVitaminsDocument>(
  {
    vitaminA: { type: Number, min: 0 },
    vitaminC: { type: Number, min: 0 },
    vitaminD: { type: Number, min: 0 },
    vitaminE: { type: Number, min: 0 },
    vitaminK: { type: Number, min: 0 },
    vitaminB12: { type: Number, min: 0 },
    folate: { type: Number, min: 0 },
  },
  { _id: false },
);

const mineralsSchema = new Schema<IMineralsDocument>(
  {
    calcium: { type: Number, min: 0 },
    iron: { type: Number, min: 0 },
    magnesium: { type: Number, min: 0 },
    potassium: { type: Number, min: 0 },
    zinc: { type: Number, min: 0 },
  },
  { _id: false },
);

// ── Main Schema ──────────────────────────────────────────────

const foodItemSchema = new Schema<IFoodItemDocument>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    brand: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    barcode: {
      type: String,
      trim: true,
      sparse: true,
      unique: true, // Only enforces uniqueness if present (sparse)
    },
    servingSize: {
      type: Number,
      required: true,
      min: 0.1,
    },
    servingUnit: {
      type: String,
      required: true,
      trim: true,
      maxlength: 20,
      default: 'g',
    },
    nutrition: {
      type: macroNutrientsSchema,
      required: true,
    },
    vitamins: {
      type: vitaminsSchema,
      default: undefined,
    },
    minerals: {
      type: mineralsSchema,
      default: undefined,
    },
    imageUrl: {
      type: String,
      trim: true,
      maxlength: 2000,
    },
    source: {
      type: String,
      required: true,
      enum: Object.values(FoodSource),
    },
    isApproved: {
      type: Boolean,
      default: false,
    },
    reportCount: {
      type: Number,
      default: 0,
      min: 0,
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

// barcode is sparse unique index (done inside schema definition)
// name is text index for searching
foodItemSchema.index({ name: 'text', brand: 'text' });

// ── Model Export ─────────────────────────────────────────────

export const FoodItem =
  (mongoose.models.FoodItem as mongoose.Model<IFoodItemDocument>) ??
  mongoose.model<IFoodItemDocument>('FoodItem', foodItemSchema);

export default FoodItem;
