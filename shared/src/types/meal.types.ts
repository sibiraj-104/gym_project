// ============================================================
// GymFuel — Meal Logging Types
// Daily meal entries — breakfast, lunch, dinner, snacks
// ============================================================

import type { IMacroNutrients } from './food.types';

export enum MealType {
  BREAKFAST = 'breakfast',
  LUNCH = 'lunch',
  DINNER = 'dinner',
  SNACK = 'snack',
}

export interface IMealEntry {
  foodId: string;
  foodName: string; // Denormalized for fast display
  mealType: MealType;
  portionGrams: number; // How many grams consumed
  nutrition: IMacroNutrients; // Calculated for this portion
  loggedAt: string; // ISO timestamp
}

export interface IDailyTotals {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  fiber: number;
  waterGlasses: number;
}

export interface IMealLog {
  _id: string;
  userId: string;
  date: string; // YYYY-MM-DD format — one log per user per day
  meals: IMealEntry[];
  totals: IDailyTotals;
  createdAt: string;
  updatedAt: string;
}

/** What the API returns for "today's log" */
export interface IDailyLogSummary {
  logId?: string; // MongoDB _id of the MealLog document (if it exists)
  date: string;
  meals: IMealEntry[];
  totals: IDailyTotals;
  goalCalories: number; // User's target
  remainingCalories: number; // goal - consumed
}
