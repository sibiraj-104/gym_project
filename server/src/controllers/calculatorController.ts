import type { Request, Response } from 'express';
import {
  tdeeCalcSchema,
  bmiCalcSchema,
  proteinCalcSchema,
  oneRepMaxCalcSchema,
  calculateTDEE,
  calculateMacroTargets,
  calculateBMI,
  calculateProteinTarget,
  calculateEpley1RM,
  FitnessGoal,
} from 'gymfuel-shared';

/**
 * Handles TDEE and daily macro target calculation.
 * GET /api/calculator/tdee
 */
export async function getTDEE(req: Request, res: Response): Promise<void> {
  const { weight, height, age, gender, activityLevel } = tdeeCalcSchema.parse(
    req.query,
  );

  const tdee = calculateTDEE(weight, height, age, gender, activityLevel);
  // Default to maintain_weight to get baseline macro targets from Mifflin-St Jeor
  const targets = calculateMacroTargets(
    tdee,
    weight,
    (req.query.goal as FitnessGoal) || FitnessGoal.MAINTAIN_WEIGHT,
  );

  res.status(200).json({
    tdee,
    targets,
  });
}

/**
 * Handles BMI and classification calculation.
 * GET /api/calculator/bmi
 */
export async function getBMI(req: Request, res: Response): Promise<void> {
  const { weight, height } = bmiCalcSchema.parse(req.query);

  const result = calculateBMI(weight, height);

  res.status(200).json(result);
}

/**
 * Handles protein range target calculation based on goals.
 * GET /api/calculator/protein
 */
export async function getProteinRange(
  req: Request,
  res: Response,
): Promise<void> {
  const { weight, goal } = proteinCalcSchema.parse(req.query);

  const result = calculateProteinTarget(weight, goal);

  res.status(200).json(result);
}

/**
 * Handles 1-Rep Max estimation based on Epley formula.
 * GET /api/calculator/1rm
 */
export async function getOneRepMax(req: Request, res: Response): Promise<void> {
  const { weight, reps } = oneRepMaxCalcSchema.parse(req.query);

  const result = calculateEpley1RM(weight, reps);

  res.status(200).json(result);
}
