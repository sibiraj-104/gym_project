// ============================================================
// GymFuel — Food & Meal Validators (Zod Schemas)
// Food search, barcode lookup, meal logging
// ============================================================

import { z } from 'zod';
import { MealType } from '../types/meal.types';

// ─── Food Search ────────────────────────────────────────────────────────────

export const foodSearchSchema = z.object({
  q: z
    .string()
    .min(2, 'Search query must be at least 2 characters')
    .max(100, 'Search query too long')
    .trim(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type FoodSearchInput = z.infer<typeof foodSearchSchema>;

// ─── Barcode Lookup ─────────────────────────────────────────────────────────

export const barcodeSchema = z.object({
  code: z
    .string()
    .min(8, 'Barcode must be at least 8 digits')
    .max(14, 'Barcode must be at most 14 digits')
    .regex(/^\d+$/, 'Barcode must contain only digits'),
});

export type BarcodeInput = z.infer<typeof barcodeSchema>;

// ─── Log a Meal Entry ───────────────────────────────────────────────────────

export const mealEntrySchema = z.object({
  foodId: z.string().min(1, 'Food ID is required'),
  mealType: z.nativeEnum(MealType, {
    errorMap: () => ({ message: 'Invalid meal type' }),
  }),
  portionGrams: z
    .number({ required_error: 'Portion size is required' })
    .min(1, 'Portion must be at least 1g')
    .max(5000, 'Portion size seems too large'),
  date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format')
    .optional(), // Defaults to today on the server
});

export type MealEntryInput = z.infer<typeof mealEntrySchema>;

// ─── Delete a Meal Entry ────────────────────────────────────────────────────

export const deleteMealEntrySchema = z.object({
  logId: z.string().min(1, 'Meal log ID is required'),
  entryIndex: z.number().int().min(0),
});

export type DeleteMealEntryInput = z.infer<typeof deleteMealEntrySchema>;

// ─── Custom Food Item (User-Added) ──────────────────────────────────────────

export const customFoodSchema = z.object({
  name: z.string().min(2, 'Food name is required').max(100).trim(),
  brand: z.string().max(100).trim().optional(),
  servingSize: z.number().min(1, 'Serving size is required'),
  servingUnit: z.string().min(1).max(20).default('g'),
  calories: z.number().min(0).max(10000),
  protein: z.number().min(0).max(500),
  carbs: z.number().min(0).max(1000),
  fat: z.number().min(0).max(500),
  fiber: z.number().min(0).max(200).optional(),
  sugar: z.number().min(0).max(500).optional(),
  sodium: z.number().min(0).max(100000).optional(), // in mg
});

export type CustomFoodInput = z.infer<typeof customFoodSchema>;
