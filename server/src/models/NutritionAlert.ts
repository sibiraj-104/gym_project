// ============================================================
// GymFuel — NutritionAlert Mongoose Model
// Maps to the `nutrition_alerts` MongoDB collection.
// Implements the INutritionAlert interface from gymfuel-shared.
// ============================================================

import mongoose, { Document, Schema } from 'mongoose';
import { AlertType } from 'gymfuel-shared';

export interface INutritionAlertDocument extends Document {
  userId: mongoose.Types.ObjectId;
  type: AlertType;
  thresholdPct: number;
  isEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const nutritionAlertSchema = new Schema<INutritionAlertDocument>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: Object.values(AlertType),
    },
    thresholdPct: {
      type: Number,
      required: true,
      min: 1,
      max: 100,
      default: 50,
    },
    isEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    emailEnabled: {
      type: Boolean,
      required: true,
      default: true,
    },
    pushEnabled: {
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

// Unique compound index: only one rule of a given type per user
nutritionAlertSchema.index({ userId: 1, type: 1 }, { unique: true });

export const NutritionAlert =
  (mongoose.models.NutritionAlert as mongoose.Model<INutritionAlertDocument>) ??
  mongoose.model<INutritionAlertDocument>(
    'NutritionAlert',
    nutritionAlertSchema,
  );

export default NutritionAlert;
