// ============================================================
// GymFuel — MongoDB Database Connection
// Handles connecting to MongoDB with exponential backoff retry,
// graceful shutdown on SIGTERM/SIGINT, and connection logging.
// ============================================================

import mongoose from 'mongoose';
import { env } from './env';

/** Maximum number of connection retry attempts */
const MAX_RETRIES = 5;

/** Base delay for exponential backoff (ms) */
const BASE_DELAY_MS = 1000;

let retryCount = 0;

/**
 * Connect to MongoDB with exponential backoff retry logic.
 * Called once at server startup.
 */
export async function connectDatabase(): Promise<void> {
  // Mongoose 7+ returns a promise from connect()
  mongoose.set('strictQuery', true);

  // Attach event listeners (fires on every reconnect too)
  mongoose.connection.on('connected', () => {
    console.log(`✅ MongoDB connected: ${mongoose.connection.host}`);
    retryCount = 0; // Reset retry counter on successful connection
  });

  mongoose.connection.on('disconnected', () => {
    console.warn('⚠️  MongoDB disconnected. Attempting to reconnect...');
  });

  mongoose.connection.on('error', (err: Error) => {
    console.error('❌ MongoDB connection error:', err.message);
  });

  await attemptConnection();
}

async function attemptConnection(): Promise<void> {
  try {
    await mongoose.connect(env.MONGO_URI, {
      // Keep connection pool sized appropriately
      maxPoolSize: 10,
      // Fail fast if initial connection takes too long
      serverSelectionTimeoutMS: 5000,
      // Heartbeat every 10 seconds
      heartbeatFrequencyMS: 10000,
    });
  } catch (err) {
    retryCount++;

    if (retryCount >= MAX_RETRIES) {
      console.error(
        `❌ Failed to connect to MongoDB after ${MAX_RETRIES} attempts. Exiting.`,
        err,
      );
      process.exit(1);
    }

    const delayMs = BASE_DELAY_MS * Math.pow(2, retryCount - 1);
    console.warn(
      `⏳ MongoDB connection attempt ${retryCount}/${MAX_RETRIES} failed. Retrying in ${delayMs}ms...`,
    );
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    await attemptConnection();
  }
}

/**
 * Gracefully close the database connection.
 * Called on SIGTERM / SIGINT (Docker stop, Ctrl+C).
 */
export async function closeDatabase(): Promise<void> {
  await mongoose.connection.close();
  console.log('🔌 MongoDB connection closed gracefully.');
}

/** Register graceful shutdown handlers */
export function registerShutdownHandlers(): void {
  const shutdown = async (signal: string) => {
    console.log(`\n📛 Received ${signal}. Shutting down gracefully...`);
    await closeDatabase();
    process.exit(0);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM')); // Docker stop
  process.on('SIGINT', () => shutdown('SIGINT')); // Ctrl+C
}
