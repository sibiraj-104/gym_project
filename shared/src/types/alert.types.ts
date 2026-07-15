// ============================================================
// GymFuel — Alert Types
// Shared between backend, frontend, and API
// ============================================================

export enum AlertType {
  CALORIES = 'calories',
  WATER = 'water',
  PROTEIN = 'protein',
}

export interface INutritionAlert {
  _id?: string;
  userId: string;
  type: AlertType;
  thresholdPct: number; // 1 to 100 percentage
  isEnabled: boolean;
  emailEnabled: boolean;
  pushEnabled: boolean;
  createdAt?: string;
  updatedAt?: string;
}
