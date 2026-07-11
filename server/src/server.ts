import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import { HealthCheckResponseSchema } from 'gymfuel-shared';
import { env } from './config/env';
import { logger } from './config/logger';
import { connectDatabase, registerShutdownHandlers } from './config/db';
import { requestLogger, requestId } from './middleware/requestLogger';
import { errorHandler, Errors } from './middleware/errorHandler';
import { notFoundHandler } from './middleware/notFoundHandler';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import foodRoutes from './routes/foodRoutes';
import mealRoutes from './routes/mealRoutes';

const app = express();

// ── Global Middlewares ──────────────────────────────────────
app.use(helmet()); // Security headers
app.use(cors({ origin: env.CORS_ORIGINS, credentials: true })); // CORS
app.use(express.json()); // JSON parsing
app.use(cookieParser()); // Parse httpOnly cookies (needed by authMiddleware)
app.use(requestId); // Inject unique Request ID
app.use(requestLogger); // HTTP request logging

// ── Routes ──────────────────────────────────────────────────

// 🔑 Authentication Routes
app.use('/api/auth', authRoutes);

// 👤 User Routes
app.use('/api/user', userRoutes);

// 🥗 Food Routes
app.use('/api/food', foodRoutes);

// 🍽️ Meal Routes
app.use('/api/meals', mealRoutes);

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
    res
      .status(500)
      .json({ error: 'Internal validation failed', details: parsed.error });
    return;
  }

  res.status(200).json(parsed.data);
});

// 🧪 Test route to trigger custom error
app.get('/api/system/error', () => {
  throw Errors.badRequest('This is a test error!');
});

// ── Error Handling ──────────────────────────────────────────
app.use(notFoundHandler); // Catch 404s
app.use(errorHandler); // Global error handler

// ── Server Startup ──────────────────────────────────────────
async function startServer() {
  // Connect to Database
  await connectDatabase();
  registerShutdownHandlers();

  const PORT = env.PORT;

  app.listen(PORT, () => {
    logger.info(`🚀 Server running on port ${PORT} in ${env.NODE_ENV} mode`);
  });
}

// Start server if run directly
if (require.main === module) {
  startServer().catch((err) => {
    logger.error('Failed to start server:', err);
    process.exit(1);
  });
}

export default app;
