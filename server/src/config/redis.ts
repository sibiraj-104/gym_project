// ============================================================
// GymFuel — Redis Client Configuration
// Initializes Redis client with fallback to ioredis-mock in
// testing environment.
// ============================================================

import Redis from 'ioredis';
import { env } from './env';
import { logger } from './logger';

let redis: Redis;

if (process.env.NODE_ENV === 'test') {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const RedisMock = require('ioredis-mock');
  redis = new RedisMock();
  logger.info('⚡ Redis initialized in Mock mode for tests.');
} else {
  redis = new Redis(env.REDIS_URI, {
    // BullMQ requires maxRetriesPerRequest to be null
    maxRetriesPerRequest: null,
    retryStrategy(times) {
      const delay = Math.min(times * 100, 3000);
      return delay;
    },
  });

  let mockActive = false;
  redis.on('connect', () => {
    logger.info('✅ Redis connected successfully.');
  });

  redis.on('error', (err) => {
    if (!mockActive && process.env.NODE_ENV === 'development') {
      logger.warn(
        '⚠️  Redis unavailable locally — switching to in-memory Redis mock.',
      );
      mockActive = true;
      try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const RedisMock = require('ioredis-mock');
        redis = new RedisMock();
      } catch {
        // ignore
      }
    } else if (!mockActive) {
      logger.error('❌ Redis connection error:', err);
    }
  });
}

export function getRedisClient(): Redis {
  return redis;
}

export { redis };
export default redis;
