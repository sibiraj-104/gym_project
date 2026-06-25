// ============================================================
// GymFuel — Activity Level Constants
// Used in TDEE calculations and UI display
// ============================================================

import { ActivityLevel } from '../types/user.types';

/** Harris-Benedict Activity Multipliers for TDEE calculation */
export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  [ActivityLevel.SEDENTARY]: 1.2, // Desk job, no exercise
  [ActivityLevel.LIGHT]: 1.375, // Light exercise 1–3 days/week
  [ActivityLevel.MODERATE]: 1.55, // Moderate exercise 3–5 days/week
  [ActivityLevel.ACTIVE]: 1.725, // Hard exercise 6–7 days/week
  [ActivityLevel.VERY_ACTIVE]: 1.9, // Hard exercise + physical job
};

/** Human-readable labels + descriptions for each level */
export const ACTIVITY_LABELS: Record<
  ActivityLevel,
  { label: string; description: string; emoji: string }
> = {
  [ActivityLevel.SEDENTARY]: {
    label: 'Sedentary',
    description: 'Little or no exercise — desk job, mostly sitting',
    emoji: '🛋️',
  },
  [ActivityLevel.LIGHT]: {
    label: 'Lightly Active',
    description: 'Light exercise or sports 1–3 days/week',
    emoji: '🚶',
  },
  [ActivityLevel.MODERATE]: {
    label: 'Moderately Active',
    description: 'Moderate exercise or sports 3–5 days/week',
    emoji: '🏃',
  },
  [ActivityLevel.ACTIVE]: {
    label: 'Very Active',
    description: 'Hard exercise or sports 6–7 days/week',
    emoji: '🏋️',
  },
  [ActivityLevel.VERY_ACTIVE]: {
    label: 'Extra Active',
    description: 'Very hard exercise, physical job, or 2× training',
    emoji: '⚡',
  },
};

/** Macro ratio presets per fitness goal */
export const MACRO_RATIOS = {
  lose_weight: { protein: 0.35, carbs: 0.35, fat: 0.3 },
  build_muscle: { protein: 0.3, carbs: 0.45, fat: 0.25 },
  maintain_weight: { protein: 0.25, carbs: 0.5, fat: 0.25 },
  improve_endurance: { protein: 0.2, carbs: 0.55, fat: 0.25 },
  increase_strength: { protein: 0.35, carbs: 0.4, fat: 0.25 },
} as const;

/** Calorie values per gram of each macro */
export const CALORIES_PER_GRAM = {
  protein: 4,
  carbs: 4,
  fat: 9,
  fiber: 2,
} as const;

/** Daily water intake target (glasses) based on weight */
export function getWaterTarget(weightKg: number): number {
  // WHO recommendation: ~35ml per kg of body weight
  const mlPerDay = weightKg * 35;
  const glasses = Math.round(mlPerDay / 250); // 250ml per glass
  return Math.min(Math.max(glasses, 6), 15); // Clamp between 6 and 15
}
