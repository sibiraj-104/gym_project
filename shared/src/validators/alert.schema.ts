import { z } from 'zod';
import { AlertType } from '../types/alert.types';

export const nutritionAlertConfigSchema = z.object({
  type: z.nativeEnum(AlertType, {
    errorMap: () => ({ message: 'Please select a valid alert type' }),
  }),
  thresholdPct: z.coerce
    .number({ required_error: 'Threshold percentage is required' })
    .int('Threshold must be a whole number')
    .min(1, 'Threshold must be at least 1%')
    .max(100, 'Threshold cannot exceed 100%'),
  isEnabled: z.boolean().default(true),
  emailEnabled: z.boolean().default(true),
  pushEnabled: z.boolean().default(false),
});

export type NutritionAlertConfigInput = z.infer<
  typeof nutritionAlertConfigSchema
>;

export const bulkNutritionAlertsSchema = z.object({
  alerts: z.array(nutritionAlertConfigSchema),
});

export type BulkNutritionAlertsInput = z.infer<
  typeof bulkNutritionAlertsSchema
>;
