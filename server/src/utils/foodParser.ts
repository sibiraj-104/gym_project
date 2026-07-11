// ============================================================
// GymFuel — External Food API Parsers
// Normalizes Open Food Facts and USDA API payloads into the
// standardized IFoodItem/IMacroNutrients format.
// ============================================================

import { FoodSource } from 'gymfuel-shared';

interface OFFProduct {
  code?: string;
  product_name?: string;
  brands?: string;
  image_front_url?: string;
  serving_quantity?: number | string;
  serving_size?: string;
  nutriments?: {
    'energy-kcal_100g'?: number;
    'energy-kcal'?: number;
    proteins_100g?: number;
    proteins?: number;
    carbohydrates_100g?: number;
    carbohydrates?: number;
    fat_100g?: number;
    fat?: number;
    fiber_100g?: number;
    fiber?: number;
    sugars_100g?: number;
    sugars?: number;
    sodium_100g?: number;
    sodium?: number;
  };
}

interface USDANutrient {
  nutrientId: number;
  nutrientName: string;
  value: number;
  unitName: string;
}

interface USDAFood {
  fdcId: number;
  description: string;
  brandName?: string;
  servingSize?: number;
  servingSizeUnit?: string;
  foodNutrients: USDANutrient[];
  image_url?: string;
}

/** Parses raw Open Food Facts product data */
export function parseOpenFoodFacts(product: OFFProduct) {
  const servingSize =
    parseFloat(String(product.serving_quantity || '100')) || 100;
  const servingUnit = product.serving_size
    ? product.serving_size.replace(/[\d\s.]/g, '') || 'g'
    : 'g';

  const nutriments = product.nutriments || {};

  // OFF sodium is in grams; convert to mg
  const rawSodium = nutriments.sodium_100g ?? nutriments.sodium ?? 0;
  const sodiumMg = Math.round(rawSodium * 1000);

  return {
    name: product.product_name || 'Unknown Product',
    brand: product.brands || undefined,
    barcode: product.code || undefined,
    servingSize,
    servingUnit,
    nutrition: {
      calories: Math.round(
        nutriments['energy-kcal_100g'] ?? nutriments['energy-kcal'] ?? 0,
      ),
      protein:
        Math.round(
          (nutriments.proteins_100g ?? nutriments.proteins ?? 0) * 10,
        ) / 10,
      carbs:
        Math.round(
          (nutriments.carbohydrates_100g ?? nutriments.carbohydrates ?? 0) * 10,
        ) / 10,
      fat: Math.round((nutriments.fat_100g ?? nutriments.fat ?? 0) * 10) / 10,
      fiber:
        Math.round((nutriments.fiber_100g ?? nutriments.fiber ?? 0) * 10) / 10,
      sugar:
        Math.round((nutriments.sugars_100g ?? nutriments.sugars ?? 0) * 10) /
        10,
      sodium: sodiumMg,
    },
    imageUrl: product.image_front_url || undefined,
    source: FoodSource.OPEN_FOOD_FACTS,
    isApproved: true,
  };
}

/** Parses raw USDA food item data */
export function parseUSDAFood(food: USDAFood) {
  const nutrients = food.foodNutrients || [];

  const getNutrientVal = (ids: number[]) => {
    const n = nutrients.find((curr) => ids.includes(curr.nutrientId));
    return n ? n.value : 0;
  };

  // Nutrient IDs:
  // Calories (Kcal): 1008
  // Protein (g): 1003
  // Carbs (g): 1005
  // Fat (g): 1004
  // Fiber (g): 1079
  // Sugar (g): 2000
  // Sodium (mg): 1093
  const calories = Math.round(getNutrientVal([1008]));
  const protein = Math.round(getNutrientVal([1003]) * 10) / 10;
  const carbs = Math.round(getNutrientVal([1005]) * 10) / 10;
  const fat = Math.round(getNutrientVal([1004]) * 10) / 10;
  const fiber = Math.round(getNutrientVal([1079]) * 10) / 10;
  const sugar = Math.round(getNutrientVal([2000]) * 10) / 10;
  const sodium = Math.round(getNutrientVal([1093]));

  return {
    name: food.description,
    brand: food.brandName || undefined,
    servingSize: food.servingSize || 100,
    servingUnit: food.servingSizeUnit || 'g',
    nutrition: {
      calories,
      protein,
      carbs,
      fat,
      fiber,
      sugar,
      sodium,
    },
    source: FoodSource.USDA,
    isApproved: true,
  };
}
