import express, { Request, Response } from 'express';
import { OnboardingSchema, HealthCheckResponseSchema } from 'gymfuel-shared';
import { z } from 'zod';

const app = express();
app.use(express.json());

// 🟢 Health check endpoint
app.get('/api/system/health', (_req: Request, res: Response) => {
  const payload = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  };

  // Validate using shared schema
  const parsed = HealthCheckResponseSchema.safeParse(payload);
  if (!parsed.success) {
    res.status(500).json({ error: 'Internal validation failed', details: parsed.error });
    return;
  }

  res.status(200).json(parsed.data);
});

// 🚀 Sample onboarding validation endpoint (Milestone 2 alignment)
app.put('/api/user/onboarding', (req: Request, res: Response) => {
  const result = OnboardingSchema.safeParse(req.body);

  if (!result.success) {
    res.status(400).json({
      error: 'Validation failed',
      details: result.error.errors.map((err: z.ZodIssue) => ({
        path: err.path.join('.'),
        message: err.message,
      })),
    });
    return;
  }

  res.status(200).json({
    message: 'Onboarding completed successfully',
    data: result.data,
  });
});

const PORT = process.env.PORT || 5000;

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

export default app;
