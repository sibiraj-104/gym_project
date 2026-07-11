// ============================================================
// GymFuel — Meal Controller
// Handles meal logging, daily log summaries, log histories,
// and meal entry deletion, with auto-fetching external food items.
// ============================================================

import { Request, Response, NextFunction } from 'express';
import mongoose from 'mongoose';
import { MealLog } from '../models/MealLog';
import { FoodItem } from '../models/FoodItem';
import { User } from '../models/User';
import { parseOpenFoodFacts, parseUSDAFood } from '../utils/foodParser';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { Errors } from '../middleware/errorHandler';
import {
  mealEntrySchema,
  deleteMealEntrySchema,
  IFoodItem,
} from 'gymfuel-shared';

/** Helper to calculate portion-specific macro details */
function calculatePortionNutrition(foodItem: IFoodItem, portionGrams: number) {
  const ratio = portionGrams / foodItem.servingSize;
  const nut = foodItem.nutrition;

  return {
    calories: Math.round(nut.calories * ratio),
    protein: Math.round(nut.protein * ratio * 10) / 10,
    carbs: Math.round(nut.carbs * ratio * 10) / 10,
    fat: Math.round(nut.fat * ratio * 10) / 10,
    fiber: nut.fiber ? Math.round(nut.fiber * ratio * 10) / 10 : 0,
    sugar: nut.sugar ? Math.round(nut.sugar * ratio * 10) / 10 : 0,
    sodium: nut.sodium ? Math.round(nut.sodium * ratio) : 0,
  };
}

/** Helper to fetch and auto-save external food items to local database */
async function resolveExternalFood(foodId: string): Promise<IFoodItem> {
  const parts = foodId.split(':');
  if (parts.length < 2) {
    throw Errors.badRequest(
      'Invalid external food ID format. Expected prefix:id.',
    );
  }

  const [prefix, id] = parts;
  const barcode = prefix === 'usda' ? `usda-${id}` : id;

  // Check local database first
  const existing = await FoodItem.findOne({ barcode });
  if (existing) {
    return existing as unknown as IFoodItem;
  }

  // Fetch externally
  logger.info(`Auto-fetching external food on log: prefix=${prefix}, id=${id}`);
  if (prefix === 'off') {
    const url = `https://world.openfoodfacts.org/api/v2/product/${id}.json?fields=code,product_name,brands,image_front_url,nutriments,serving_quantity,serving_size`;
    const res = await fetch(url);
    if (!res.ok) {
      throw Errors.notFound(
        `Product with barcode ${id} not found on Open Food Facts.`,
      );
    }
    const data = await res.json();
    if (!data.product || data.status === 0) {
      throw Errors.notFound(
        `Product with barcode ${id} not found on Open Food Facts.`,
      );
    }

    const parsed = parseOpenFoodFacts(data.product);
    const newFood = new FoodItem(parsed);
    return (await newFood.save()) as unknown as IFoodItem;
  } else if (prefix === 'usda') {
    const apiKey = env.USDA_API_KEY || 'DEMO_KEY';
    const url = `https://api.nal.usda.gov/fdc/v1/food/${id}?api_key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      throw Errors.notFound(`Food with ID ${id} not found on USDA.`);
    }
    const data = await res.json();
    const parsed = parseUSDAFood(data);
    const newFood = new FoodItem({
      ...parsed,
      barcode, // save as usda-<id>
    });
    return (await newFood.save()) as unknown as IFoodItem;
  } else {
    throw Errors.badRequest(`Unsupported external food prefix: ${prefix}`);
  }
}

/**
 * POST /api/meals/log
 * Log a meal entry. Auto-resolves external OFF/USDA food items.
 * Increments user streak on first log of the day.
 */
export async function logMeal(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // 1. Validate request body
    const validation = mealEntrySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid meal log data',
          details: validation.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { foodId, portionGrams, mealType } = validation.data;
    // Default to today's date YYYY-MM-DD in local time
    const date = validation.data.date || new Date().toISOString().split('T')[0];

    // 2. Resolve Food Item
    let foodItem: IFoodItem;
    const isObjectId = mongoose.Types.ObjectId.isValid(foodId);

    if (isObjectId) {
      const localFood = await FoodItem.findById(foodId);
      if (!localFood) {
        res.status(404).json({
          error: { code: 'NOT_FOUND', message: 'Food item not found.' },
        });
        return;
      }
      foodItem = localFood as unknown as IFoodItem;
    } else {
      // Resolve external off: or usda: item
      foodItem = await resolveExternalFood(foodId);
    }

    // 3. Calculate Portion Nutrition
    const portionNutrition = calculatePortionNutrition(foodItem, portionGrams);

    // 4. Retrieve or Create Daily Meal Log
    let mealLog = await MealLog.findOne({ userId, date });
    let isFirstLogOfDay = false;

    if (!mealLog) {
      isFirstLogOfDay = true;
      mealLog = new MealLog({
        userId,
        date,
        meals: [],
        totals: {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          waterGlasses: 0,
        },
      });
    } else if (mealLog.meals.length === 0) {
      isFirstLogOfDay = true;
    }

    // 5. Add Meal Entry
    mealLog.meals.push({
      foodId: foodItem._id.toString(),
      foodName: foodItem.name,
      mealType,
      portionGrams,
      nutrition: portionNutrition,
      loggedAt: new Date(),
    });

    // 6. Recalculate Daily Totals
    const dailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      waterGlasses: mealLog.totals.waterGlasses,
    };
    for (const meal of mealLog.meals) {
      dailyTotals.calories += meal.nutrition.calories;
      dailyTotals.protein += meal.nutrition.protein;
      dailyTotals.carbs += meal.nutrition.carbs;
      dailyTotals.fat += meal.nutrition.fat;
      dailyTotals.fiber += meal.nutrition.fiber || 0;
    }

    // Round values
    dailyTotals.calories = Math.round(dailyTotals.calories);
    dailyTotals.protein = Math.round(dailyTotals.protein * 10) / 10;
    dailyTotals.carbs = Math.round(dailyTotals.carbs * 10) / 10;
    dailyTotals.fat = Math.round(dailyTotals.fat * 10) / 10;
    dailyTotals.fiber = Math.round(dailyTotals.fiber * 10) / 10;

    mealLog.totals = dailyTotals;
    const savedLog = await mealLog.save();

    // 7. Update User Streak on First Log of Day
    if (isFirstLogOfDay) {
      const user = await User.findById(userId);
      if (user) {
        // Calculate yesterday's date string YYYY-MM-DD
        const yesterday = new Date(date);
        yesterday.setDate(yesterday.getDate() - 1);
        const yesterdayStr = yesterday.toISOString().split('T')[0];

        const yesterdayLog = await MealLog.findOne({
          userId,
          date: yesterdayStr,
          'meals.0': { $exists: true },
        });

        if (yesterdayLog) {
          user.streakCount += 1;
        } else {
          user.streakCount = 1;
        }
        user.lastActiveAt = new Date();
        await user.save();
      }
    }

    res.status(201).json(savedLog);
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/meals/log/today
 * Returns daily log summary matching IDailyLogSummary.
 */
export async function getTodayLog(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const date =
      (req.query.date as string) || new Date().toISOString().split('T')[0];

    const mealLog = await MealLog.findOne({ userId, date });
    const user = await User.findById(userId);

    const goalCalories = user?.goals?.targetCalories || 2000;
    const meals = mealLog ? mealLog.meals : [];
    const totals = mealLog
      ? mealLog.totals
      : {
          calories: 0,
          protein: 0,
          carbs: 0,
          fat: 0,
          fiber: 0,
          waterGlasses: 0,
        };

    const remainingCalories = Math.max(0, goalCalories - totals.calories);

    res.status(200).json({
      logId: mealLog?._id?.toString() || undefined,
      date,
      meals,
      totals,
      goalCalories,
      remainingCalories,
    });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/meals/log/history
 * Returns historical meal logs within startDate and endDate query range.
 */
export async function getMealHistory(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    const { startDate, endDate } = req.query;

    if (!startDate || !endDate) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'startDate and endDate query parameters are required.',
        },
      });
      return;
    }

    const logs = await MealLog.find({
      userId,
      date: {
        $gte: startDate as string,
        $lte: endDate as string,
      },
    }).sort({ date: -1 });

    res.status(200).json(logs);
  } catch (err) {
    next(err);
  }
}

/**
 * DELETE /api/meals/log/entry
 * Deletes a meal entry at a given index from a user's log, updating totals.
 */
export async function deleteMealEntry(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const userId = req.user?.userId;
    if (!userId) {
      res.status(401).json({
        error: { code: 'UNAUTHORIZED', message: 'Authentication required' },
      });
      return;
    }

    // Validate body
    const validation = deleteMealEntrySchema.safeParse(req.body);
    if (!validation.success) {
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid delete parameters',
          details: validation.error.flatten().fieldErrors,
        },
      });
      return;
    }

    const { logId, entryIndex } = validation.data;

    // Find log and ensure it belongs to the authenticated user
    const mealLog = await MealLog.findOne({ _id: logId, userId });
    if (!mealLog) {
      res.status(404).json({
        error: {
          code: 'NOT_FOUND',
          message: 'Meal log not found or unauthorized.',
        },
      });
      return;
    }

    if (entryIndex < 0 || entryIndex >= mealLog.meals.length) {
      res.status(400).json({
        error: { code: 'BAD_REQUEST', message: 'Invalid meal entry index.' },
      });
      return;
    }

    // Remove entry
    mealLog.meals.splice(entryIndex, 1);

    // Recalculate totals
    const dailyTotals = {
      calories: 0,
      protein: 0,
      carbs: 0,
      fat: 0,
      fiber: 0,
      waterGlasses: mealLog.totals.waterGlasses,
    };
    for (const meal of mealLog.meals) {
      dailyTotals.calories += meal.nutrition.calories;
      dailyTotals.protein += meal.nutrition.protein;
      dailyTotals.carbs += meal.nutrition.carbs;
      dailyTotals.fat += meal.nutrition.fat;
      dailyTotals.fiber += meal.nutrition.fiber || 0;
    }

    dailyTotals.calories = Math.round(dailyTotals.calories);
    dailyTotals.protein = Math.round(dailyTotals.protein * 10) / 10;
    dailyTotals.carbs = Math.round(dailyTotals.carbs * 10) / 10;
    dailyTotals.fat = Math.round(dailyTotals.fat * 10) / 10;
    dailyTotals.fiber = Math.round(dailyTotals.fiber * 10) / 10;

    mealLog.totals = dailyTotals;
    const savedLog = await mealLog.save();

    res.status(200).json(savedLog);
  } catch (err) {
    next(err);
  }
}
