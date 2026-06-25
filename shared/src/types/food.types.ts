// ============================================================
// GymFuel — Food & Nutrition Types
// Used by food search, barcode lookup, AI scan, meal logging
// ============================================================

export enum FoodSource {
  OPEN_FOOD_FACTS = 'openFoodFacts',
  USDA = 'usda',
  NUTRITIONIX = 'nutritionix',
  USER_ADDED = 'userAdded',
  ADMIN_ADDED = 'adminAdded',
  AI_SCANNED = 'aiScanned',
}

export interface IMacroNutrients {
  calories: number;
  protein: number; // in grams
  carbs: number; // in grams
  fat: number; // in grams
  fiber?: number; // in grams
  sugar?: number; // in grams
  sodium?: number; // in mg
}

export interface IVitamins {
  vitaminA?: number; // in mcg
  vitaminC?: number; // in mg
  vitaminD?: number; // in mcg
  vitaminE?: number; // in mg
  vitaminK?: number; // in mcg
  vitaminB12?: number; // in mcg
  folate?: number; // in mcg
}

export interface IMinerals {
  calcium?: number; // in mg
  iron?: number; // in mg
  magnesium?: number; // in mg
  potassium?: number; // in mg
  zinc?: number; // in mg
}

export interface IFoodItem {
  _id: string;
  name: string;
  brand?: string;
  barcode?: string;
  servingSize: number; // in grams
  servingUnit: string; // 'g', 'ml', 'piece', 'cup', etc.
  nutrition: IMacroNutrients;
  vitamins?: IVitamins;
  minerals?: IMinerals;
  imageUrl?: string;
  source: FoodSource;
  isApproved: boolean;
  reportCount: number;
  createdAt: string;
  updatedAt: string;
}

/** Minimal food data returned in search results */
export type IFoodSearchResult = Pick<
  IFoodItem,
  | '_id'
  | 'name'
  | 'brand'
  | 'barcode'
  | 'servingSize'
  | 'servingUnit'
  | 'nutrition'
  | 'imageUrl'
>;
