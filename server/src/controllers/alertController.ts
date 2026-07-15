import type { Request, Response } from 'express';
import {
  nutritionAlertConfigSchema,
  bulkNutritionAlertsSchema,
} from 'gymfuel-shared';
import NutritionAlert from '../models/NutritionAlert';
import { Errors } from '../middleware/errorHandler';

/**
 * Configure/update user alert rules (supports both single rule or bulk configurations).
 * POST /api/nutrition/alerts
 */
export async function configureAlerts(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user?.userId) {
    throw Errors.unauthorized('Authentication required.');
  }

  const isBulk = req.body && Array.isArray(req.body.alerts);

  if (isBulk) {
    const parsed = bulkNutritionAlertsSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest('Invalid bulk alerts configuration format.');
    }

    const { alerts } = parsed.data;
    const updatedAlerts = [];

    for (const alert of alerts) {
      const doc = await NutritionAlert.findOneAndUpdate(
        { userId: req.user.userId, type: alert.type },
        {
          thresholdPct: alert.thresholdPct,
          isEnabled: alert.isEnabled,
          emailEnabled: alert.emailEnabled,
          pushEnabled: alert.pushEnabled,
        },
        { upsert: true, new: true },
      );
      updatedAlerts.push(doc);
    }

    res.status(200).json({ alerts: updatedAlerts });
  } else {
    const parsed = nutritionAlertConfigSchema.safeParse(req.body);
    if (!parsed.success) {
      throw Errors.badRequest('Invalid alert configuration format.');
    }

    const alert = parsed.data;
    const doc = await NutritionAlert.findOneAndUpdate(
      { userId: req.user.userId, type: alert.type },
      {
        thresholdPct: alert.thresholdPct,
        isEnabled: alert.isEnabled,
        emailEnabled: alert.emailEnabled,
        pushEnabled: alert.pushEnabled,
      },
      { upsert: true, new: true },
    );

    res.status(200).json(doc);
  }
}

/**
 * Fetch configured alert rules for the logged-in user.
 * GET /api/nutrition/alerts
 */
export async function getUserAlerts(
  req: Request,
  res: Response,
): Promise<void> {
  if (!req.user?.userId) {
    throw Errors.unauthorized('Authentication required.');
  }

  const alerts = await NutritionAlert.find({ userId: req.user.userId });
  res.status(200).json({ alerts });
}
