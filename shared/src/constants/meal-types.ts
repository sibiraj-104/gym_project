// ============================================================
// GymFuel — Meal Type Constants
// ============================================================

import { MealType } from '../types/meal.types';

/** Display order for meals throughout the day */
export const MEAL_ORDER: MealType[] = [
  MealType.BREAKFAST,
  MealType.LUNCH,
  MealType.DINNER,
  MealType.SNACK,
];

/** Human-readable labels + emoji for each meal type */
export const MEAL_LABELS: Record<
  MealType,
  { label: string; emoji: string; timeHint: string }
> = {
  [MealType.BREAKFAST]: {
    label: 'Breakfast',
    emoji: '🌅',
    timeHint: '6am – 10am',
  },
  [MealType.LUNCH]: {
    label: 'Lunch',
    emoji: '☀️',
    timeHint: '12pm – 2pm',
  },
  [MealType.DINNER]: {
    label: 'Dinner',
    emoji: '🌙',
    timeHint: '6pm – 9pm',
  },
  [MealType.SNACK]: {
    label: 'Snack',
    emoji: '🍎',
    timeHint: 'Anytime',
  },
};

/** Typical calorie distribution per meal (% of daily target) */
export const MEAL_CALORIE_DISTRIBUTION: Record<MealType, number> = {
  [MealType.BREAKFAST]: 0.25, // 25%
  [MealType.LUNCH]: 0.35, // 35%
  [MealType.DINNER]: 0.3, // 30%
  [MealType.SNACK]: 0.1, // 10%
};
