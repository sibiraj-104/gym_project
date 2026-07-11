import type { Request, Response } from 'express';
import { User } from '../models/User';
import { Errors } from '../middleware/errorHandler';
import {
  onboardingSchema,
  calculateTDEE,
  calculateMacroTargets,
} from 'gymfuel-shared';

/**
 * Returns the profile of the currently authenticated user.
 *
 * GET /api/user/profile
 */
export async function getUserProfile(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw Errors.unauthorized('Authentication required.');
  }

  const user = await User.findById(req.user.userId);
  if (!user) {
    throw Errors.notFound('User');
  }

  res.status(200).json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      profile: user.profile,
      goals: user.goals,
      streakCount: user.streakCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}

/**
 * Saves onboarding data, calculates targets, and marks user as onboarded.
 *
 * PUT /api/user/onboarding
 */
export async function updateOnboarding(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user) {
    throw Errors.unauthorized('Authentication required.');
  }

  const { age, weight, height, gender, activityLevel, goal } =
    onboardingSchema.parse(req.body);

  const user = await User.findById(req.user.userId);
  if (!user) {
    throw Errors.notFound('User');
  }

  // Calculate TDEE
  const tdee = calculateTDEE(weight, height, age, gender, activityLevel);

  // Calculate macro targets (protein, carbs, fat, water) based on TDEE and Goal
  const targets = calculateMacroTargets(tdee, weight, goal);

  user.profile = {
    age,
    weight,
    height,
    gender,
    activityLevel,
  };

  user.goals = {
    type: goal,
    targetCalories: targets.targetCalories,
    targetProtein: targets.targetProtein,
    targetCarbs: targets.targetCarbs,
    targetFat: targets.targetFat,
    targetWaterGlasses: targets.targetWaterGlasses,
  };

  user.isOnboarded = true;
  await user.save();

  res.status(200).json({
    message: 'Onboarding completed successfully',
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isOnboarded: user.isOnboarded,
      profile: user.profile,
      goals: user.goals,
      streakCount: user.streakCount,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    },
  });
}
