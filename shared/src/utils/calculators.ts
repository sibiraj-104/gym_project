import {
  ActivityLevel,
  FitnessGoal,
  Gender,
  IUserGoals,
} from '../types/user.types';

/**
 * Calculates Basal Metabolic Rate (BMR) using the Mifflin-St Jeor formula.
 */
export function calculateBMR(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
): number {
  const base = 10 * weight + 6.25 * height - 5 * age;
  if (gender === Gender.MALE) {
    return base + 5;
  } else if (gender === Gender.FEMALE) {
    return base - 161;
  } else {
    // Gender.OTHER: Use the average baseline of male and female for balance
    return base - 78;
  }
}

/**
 * Calculates Total Daily Energy Expenditure (TDEE) based on BMR and activity level.
 */
export function calculateTDEE(
  weight: number,
  height: number,
  age: number,
  gender: Gender,
  activityLevel: ActivityLevel,
): number {
  const bmr = calculateBMR(weight, height, age, gender);

  const multipliers: Record<ActivityLevel, number> = {
    [ActivityLevel.SEDENTARY]: 1.2,
    [ActivityLevel.LIGHT]: 1.375,
    [ActivityLevel.MODERATE]: 1.55,
    [ActivityLevel.ACTIVE]: 1.725,
    [ActivityLevel.VERY_ACTIVE]: 1.9,
  };

  const multiplier = multipliers[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates target macronutrient goals (protein, carbs, fat) and water based on calorie targets and fitness goal.
 */
export function calculateMacroTargets(
  calories: number,
  weight: number,
  goal: FitnessGoal,
): Omit<IUserGoals, 'type'> {
  let targetCalories = calories;

  // Adjust calories based on goal
  if (goal === FitnessGoal.LOSE_WEIGHT) {
    targetCalories = Math.max(1200, calories - 500); // 500 kcal deficit (ensure safe floor of 1200 kcal)
  } else if (goal === FitnessGoal.BUILD_MUSCLE) {
    targetCalories = calories + 300; // 300 kcal surplus
  }

  // Protein target:
  // Lose weight / build muscle: 2.0g per kg of body weight
  // Others: 1.6g per kg of body weight
  let proteinPerKg = 1.6;
  if (goal === FitnessGoal.BUILD_MUSCLE || goal === FitnessGoal.LOSE_WEIGHT) {
    proteinPerKg = 2.0;
  }
  const targetProtein = Math.round(weight * proteinPerKg);

  // Fat target: 25% of total calories
  // 1g fat = 9 calories
  const fatCalories = targetCalories * 0.25;
  const targetFat = Math.round(fatCalories / 9);

  // Carbs target: remaining calories
  // 1g carb = 4 calories, 1g protein = 4 calories
  const proteinCalories = targetProtein * 4;
  const fatCaloriesActual = targetFat * 9;
  const remainingCalories =
    targetCalories - (proteinCalories + fatCaloriesActual);
  const targetCarbs = Math.max(0, Math.round(remainingCalories / 4));

  // Water target: 8 glasses baseline, 1 extra glass per 10kg above 60kg, capped at 16 glasses
  const excessWeight = Math.max(0, weight - 60);
  const targetWaterGlasses = Math.min(
    16,
    Math.max(8, 8 + Math.round(excessWeight / 10)),
  );

  return {
    targetCalories,
    targetProtein,
    targetCarbs,
    targetFat,
    targetWaterGlasses,
  };
}

/**
 * Calculates Body Mass Index (BMI) and provides classification.
 */
export function calculateBMI(
  weight: number,
  height: number,
): { bmi: number; classification: string } {
  const heightMeters = height / 100;
  const bmi = weight / (heightMeters * heightMeters);
  const roundedBmi = Math.round(bmi * 10) / 10;

  let classification = 'Normal';
  if (roundedBmi < 18.5) {
    classification = 'Underweight';
  } else if (roundedBmi < 25.0) {
    classification = 'Normal';
  } else if (roundedBmi < 30.0) {
    classification = 'Overweight';
  } else {
    classification = 'Obese';
  }

  return {
    bmi: roundedBmi,
    classification,
  };
}

/**
 * Calculates recommended daily protein range (min/max in grams) based on goal.
 */
export function calculateProteinTarget(
  weight: number,
  goal: FitnessGoal,
): { min: number; max: number } {
  let minFactor = 1.2;
  let maxFactor = 1.6;

  if (goal === FitnessGoal.BUILD_MUSCLE) {
    minFactor = 2.0;
    maxFactor = 2.4;
  } else if (goal === FitnessGoal.LOSE_WEIGHT) {
    minFactor = 1.8;
    maxFactor = 2.2;
  } else if (goal === FitnessGoal.MAINTAIN_WEIGHT) {
    minFactor = 1.2;
    maxFactor = 1.6;
  } else {
    minFactor = 1.4;
    maxFactor = 1.8;
  }

  return {
    min: Math.round(weight * minFactor),
    max: Math.round(weight * maxFactor),
  };
}

/**
 * Estimates One-Rep Max (1RM) using Epley formula.
 */
export function calculateEpley1RM(
  weight: number,
  reps: number,
): { oneRepMax: number } {
  if (reps <= 1) {
    return { oneRepMax: Math.round(weight) };
  }
  const oneRepMax = weight * (1 + reps / 30);
  return {
    oneRepMax: Math.round(oneRepMax),
  };
}
