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

  redis.on('connect', () => {
    logger.info('✅ Redis connected successfully.');
  });

  redis.on('error', (err) => {
    logger.error('❌ Redis connection error:', err);
  });
}

export { redis };
export default redis;
