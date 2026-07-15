import { AlertType, IUserGoals, IDailyTotals } from 'gymfuel-shared';
import User from '../models/User';
import MealLog from '../models/MealLog';
import NutritionAlert from '../models/NutritionAlert';
import { logger } from '../config/logger';

export interface ITriggeredAlert {
  userId: string;
  type: AlertType;
  consumed: number;
  target: number;
  thresholdPct: number;
  emailSent: boolean;
  pushSent: boolean;
}

/**
 * Checks active alert rules for a specific user and date.
 * Logs and simulates dispatches for triggered alerts.
 */
export async function checkUserAlerts(
  userId: string,
  dateStr: string,
): Promise<ITriggeredAlert[]> {
  const triggeredAlerts: ITriggeredAlert[] = [];

  // 1. Fetch active alert rules for user
  const activeRules = await NutritionAlert.find({ userId, isEnabled: true });
  if (activeRules.length === 0) return [];

  // 2. Fetch user profile & goals
  const user = await User.findById(userId);
  if (!user || !user.goals) {
    logger.warn(`Alert check skipped: User goals not found for user ${userId}`);
    return [];
  }

  // 3. Fetch user's meal log for the specified date
  const mealLog = await MealLog.findOne({ userId, date: dateStr });

  for (const rule of activeRules) {
    const target = getTargetValue(user.goals, rule.type);
    const consumed = mealLog ? getConsumedValue(mealLog.totals, rule.type) : 0;
    const factor = rule.thresholdPct / 100;

    // Check if consumption drops below the target scaled by thresholdPct
    if (consumed < target * factor) {
      const emailSent = rule.emailEnabled;
      const pushSent = rule.pushEnabled;

      logger.info(
        `🔔 [ALERT ENG] Threshold breach detected for user ${userId}. Type: ${rule.type}. Consumed: ${consumed}/${target} (${Math.round((consumed / target) * 100)}% vs threshold ${rule.thresholdPct}%)`,
      );

      if (emailSent) {
        logger.info(
          `📧 [EMAIL NOTIFICATION] Sent nutrition warning email to ${user.email} (Breached threshold: ${rule.thresholdPct}% for type ${rule.type})`,
        );
      }
      if (pushSent) {
        logger.info(
          `📱 [PUSH NOTIFICATION] Sent nutrition push alert to user ${userId} (Breached threshold: ${rule.thresholdPct}% for type ${rule.type})`,
        );
      }

      triggeredAlerts.push({
        userId,
        type: rule.type,
        consumed,
        target,
        thresholdPct: rule.thresholdPct,
        emailSent,
        pushSent,
      });
    }
  }

  return triggeredAlerts;
}

/**
 * Daily runner that scans all active alerts in the database for a specific date.
 */
export async function runDailyAlertEngine(dateStr: string): Promise<number> {
  logger.info(`🚀 Starting daily alert engine scan for date: ${dateStr}`);

  // Fetch all active rules in the system
  const activeRules = await NutritionAlert.find({ isEnabled: true });
  if (activeRules.length === 0) {
    logger.info('No active alert rules found in database.');
    return 0;
  }

  // Extract unique user IDs
  const userIds = Array.from(
    new Set(activeRules.map((rule) => rule.userId.toString())),
  );

  let totalTriggered = 0;

  for (const userId of userIds) {
    try {
      const triggered = await checkUserAlerts(userId, dateStr);
      totalTriggered += triggered.length;
    } catch (err) {
      logger.error(`Error processing alerts for user ${userId}:`, err);
    }
  }

  logger.info(
    `Finished daily alert engine scan. Triggered ${totalTriggered} alert notification(s).`,
  );
  return totalTriggered;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function getTargetValue(goals: IUserGoals, type: AlertType): number {
  switch (type) {
    case AlertType.CALORIES:
      return goals.targetCalories;
    case AlertType.WATER:
      return goals.targetWaterGlasses;
    case AlertType.PROTEIN:
      return goals.targetProtein;
    default:
      return Infinity;
  }
}

function getConsumedValue(totals: IDailyTotals, type: AlertType): number {
  switch (type) {
    case AlertType.CALORIES:
      return totals.calories;
    case AlertType.WATER:
      return totals.waterGlasses;
    case AlertType.PROTEIN:
      return totals.protein;
    default:
      return 0;
  }
}
