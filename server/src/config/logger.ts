// ============================================================
// GymFuel — Winston Logger Configuration
// Structured JSON logs in production, pretty colored logs in dev.
// Log files: logs/error.log + logs/combined.log
// ============================================================

import winston from 'winston';
import path from 'path';
import fs from 'fs';

// Ensure logs directory exists
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// ── Custom log format for development (colored + readable) ──
const devFormat = winston.format.combine(
  winston.format.colorize({ all: true }),
  winston.format.timestamp({ format: 'HH:mm:ss' }),
  winston.format.printf(({ level, message, timestamp, ...meta }) => {
    const metaStr = Object.keys(meta).length
      ? '\n' + JSON.stringify(meta, null, 2)
      : '';
    return `${timestamp} [${level}] ${message}${metaStr}`;
  }),
);

// ── JSON format for production (machine-readable) ────────────
const prodFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json(),
);

const isDev = process.env.NODE_ENV !== 'production';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? 'info',
  format: isDev ? devFormat : prodFormat,

  transports: [
    // Always log to console
    new winston.transports.Console(),

    // Error logs only (persistent file)
    new winston.transports.File({
      filename: path.join(logsDir, 'error.log'),
      level: 'error',
      format: prodFormat, // Always JSON in file
      maxsize: 10 * 1024 * 1024, // 10MB max file size
      maxFiles: 5, // Keep last 5 rotated files
    }),

    // Combined logs (all levels)
    new winston.transports.File({
      filename: path.join(logsDir, 'combined.log'),
      format: prodFormat,
      maxsize: 10 * 1024 * 1024,
      maxFiles: 5,
    }),
  ],

  // Don't crash on uncaught exceptions — log them instead
  exceptionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'exceptions.log'),
      format: prodFormat,
    }),
  ],

  rejectionHandlers: [
    new winston.transports.File({
      filename: path.join(logsDir, 'rejections.log'),
      format: prodFormat,
    }),
  ],
});

// Add a stream interface for Morgan HTTP logger integration
export const morganStream = {
  write: (message: string) => {
    logger.http(message.trim());
  },
};
