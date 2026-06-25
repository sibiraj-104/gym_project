// ============================================================
// GymFuel — User Types
// Shared between backend (Mongoose), frontend (React), and API
// ============================================================

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SUPPORT = 'support',
  DEVELOPER = 'developer',
}

export enum ActivityLevel {
  SEDENTARY = 'sedentary', // Little or no exercise
  LIGHT = 'light', // 1–3 days/week
  MODERATE = 'moderate', // 3–5 days/week
  ACTIVE = 'active', // 6–7 days/week
  VERY_ACTIVE = 'very_active', // Hard exercise + physical job
}

export enum FitnessGoal {
  LOSE_WEIGHT = 'lose_weight',
  BUILD_MUSCLE = 'build_muscle',
  MAINTAIN_WEIGHT = 'maintain_weight',
  IMPROVE_ENDURANCE = 'improve_endurance',
  INCREASE_STRENGTH = 'increase_strength',
}

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
}

export interface IUserProfile {
  age: number;
  weight: number; // in kg
  height: number; // in cm
  gender: Gender;
  activityLevel: ActivityLevel;
}

export interface IUserGoals {
  type: FitnessGoal;
  targetCalories: number;
  targetProtein: number; // in grams
  targetCarbs: number; // in grams
  targetFat: number; // in grams
  targetWaterGlasses: number;
}

export interface IUser {
  _id: string;
  name: string;
  email: string;
  googleId?: string;
  passwordHash?: string;
  role: UserRole;
  profile?: IUserProfile;
  goals?: IUserGoals;
  isOnboarded: boolean;
  streakCount: number;
  lastActiveAt: string; // ISO date string
  createdAt: string;
  updatedAt: string;
}

/** Safe public version — never include passwordHash */
export type IPublicUser = Omit<IUser, 'passwordHash' | 'googleId'>;
