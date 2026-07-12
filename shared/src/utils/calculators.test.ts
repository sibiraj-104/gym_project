import {
  calculateBMR,
  calculateTDEE,
  calculateMacroTargets,
  calculateBMI,
  calculateProteinTarget,
  calculateEpley1RM,
} from './calculators';
import { FitnessGoal, Gender, ActivityLevel } from '../types/user.types';
import { describe, test, expect } from 'vitest';

describe('GymFuel Calculators Unit Tests', () => {
  // ─── BMR & TDEE Calculations ───────────────────────────────────────────────
  describe('BMR & TDEE', () => {
    test('calculateBMR should calculate correctly for Male', () => {
      // 10 * 70 + 6.25 * 175 - 5 * 25 + 5 = 700 + 1093.75 - 125 + 5 = 1673.75
      const bmr = calculateBMR(70, 175, 25, Gender.MALE);
      expect(bmr).toBe(1673.75);
    });

    test('calculateBMR should calculate correctly for Female', () => {
      // 10 * 60 + 6.25 * 165 - 5 * 30 - 161 = 600 + 1031.25 - 150 - 161 = 1320.25
      const bmr = calculateBMR(60, 165, 30, Gender.FEMALE);
      expect(bmr).toBe(1320.25);
    });

    test('calculateBMR should calculate correctly for Other gender', () => {
      // 10 * 70 + 6.25 * 175 - 5 * 25 - 78 = 700 + 1093.75 - 125 - 78 = 1590.75
      const bmr = calculateBMR(70, 175, 25, Gender.OTHER);
      expect(bmr).toBe(1590.75);
    });

    test('calculateTDEE should calculate correctly based on activity levels', () => {
      const weight = 70;
      const height = 175;
      const age = 25;
      const gender = Gender.MALE;

      // BMR is 1673.75
      // Sedentary BMR * 1.2 = 2008.5 -> rounded to 2009
      expect(
        calculateTDEE(weight, height, age, gender, ActivityLevel.SEDENTARY),
      ).toBe(2009);

      // Moderate BMR * 1.55 = 2594.3125 -> rounded to 2594
      expect(
        calculateTDEE(weight, height, age, gender, ActivityLevel.MODERATE),
      ).toBe(2594);
    });
  });

  // ─── Macro & Water Targets ─────────────────────────────────────────────────
  describe('Macro Targets', () => {
    test('calculateMacroTargets for building muscle (surplus + 2.0g protein)', () => {
      const calories = 2500;
      const weight = 70;
      const result = calculateMacroTargets(
        calories,
        weight,
        FitnessGoal.BUILD_MUSCLE,
      );

      // Target Calories: 2500 + 300 = 2800 kcal
      expect(result.targetCalories).toBe(2800);

      // Target Protein: 70 * 2.0 = 140 g
      expect(result.targetProtein).toBe(140);

      // Fat target: 2800 * 0.25 = 700 cal / 9 = ~78 g
      expect(result.targetFat).toBe(78);

      // Carbs target: remaining calories
      // 2800 - (140 * 4 + 78 * 9) = 2800 - (560 + 702) = 1538 cal / 4 = ~385 g
      expect(result.targetCarbs).toBe(385);
    });

    test('calculateMacroTargets for weight loss (deficit + 2.0g protein)', () => {
      const calories = 2500;
      const weight = 70;
      const result = calculateMacroTargets(
        calories,
        weight,
        FitnessGoal.LOSE_WEIGHT,
      );

      // Target Calories: 2500 - 500 = 2000 kcal
      expect(result.targetCalories).toBe(2000);

      // Target Protein: 70 * 2.0 = 140 g
      expect(result.targetProtein).toBe(140);
    });
  });

  // ─── BMI Calculations ──────────────────────────────────────────────────────
  describe('BMI Calculator', () => {
    test('calculateBMI normal weight', () => {
      // 70 / (1.75 * 1.75) = 22.857 -> rounded to 22.9
      const result = calculateBMI(70, 175);
      expect(result.bmi).toBe(22.9);
      expect(result.classification).toBe('Normal');
    });

    test('calculateBMI underweight classification', () => {
      // 50 / (1.75 * 1.75) = 16.326 -> rounded to 16.3
      const result = calculateBMI(50, 175);
      expect(result.bmi).toBe(16.3);
      expect(result.classification).toBe('Underweight');
    });

    test('calculateBMI overweight classification', () => {
      // 85 / (1.75 * 1.75) = 27.755 -> rounded to 27.8
      const result = calculateBMI(85, 175);
      expect(result.bmi).toBe(27.8);
      expect(result.classification).toBe('Overweight');
    });

    test('calculateBMI obese classification', () => {
      // 100 / (1.75 * 1.75) = 32.653 -> rounded to 32.7
      const result = calculateBMI(100, 175);
      expect(result.bmi).toBe(32.7);
      expect(result.classification).toBe('Obese');
    });
  });

  // ─── Protein Range Target ──────────────────────────────────────────────────
  describe('Protein Target Range', () => {
    test('calculateProteinTarget for building muscle', () => {
      const result = calculateProteinTarget(70, FitnessGoal.BUILD_MUSCLE);
      expect(result.min).toBe(140);
      expect(result.max).toBe(168);
    });

    test('calculateProteinTarget for weight loss', () => {
      const result = calculateProteinTarget(70, FitnessGoal.LOSE_WEIGHT);
      expect(result.min).toBe(126);
      expect(result.max).toBe(154);
    });

    test('calculateProteinTarget for maintaining weight', () => {
      const result = calculateProteinTarget(70, FitnessGoal.MAINTAIN_WEIGHT);
      expect(result.min).toBe(84);
      expect(result.max).toBe(112);
    });

    test('calculateProteinTarget fallback goal', () => {
      const result = calculateProteinTarget(70, FitnessGoal.IMPROVE_ENDURANCE);
      expect(result.min).toBe(98);
      expect(result.max).toBe(126);
    });
  });

  // ─── Epley One-Rep Max ─────────────────────────────────────────────────────
  describe('Epley One-Rep Max (1RM)', () => {
    test('calculateEpley1RM for multiple reps', () => {
      // 100 * (1 + 5 / 30) = 116.666 -> rounded to 117
      const result = calculateEpley1RM(100, 5);
      expect(result.oneRepMax).toBe(117);
    });

    test('calculateEpley1RM for single rep should return initial weight', () => {
      const result = calculateEpley1RM(100, 1);
      expect(result.oneRepMax).toBe(100);
    });
  });
});
