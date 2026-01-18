import Redis from 'ioredis';

const globalForRedis = globalThis as unknown as {
  redis: Redis | undefined;
};

function getRedisClient(): Redis {
  if (!process.env.REDIS_URL) {
    // Return a mock for development without Redis
    console.warn('REDIS_URL not set, using memory store');
    return new Redis({
      host: 'localhost',
      port: 6379,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
    });
  }

  return new Redis(process.env.REDIS_URL, {
    maxRetriesPerRequest: 3,
  });
}

export const redis = globalForRedis.redis ?? getRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Lock utilities for settlement engine
const LOCK_TTL = 300; // 5 minutes

export async function acquireLock(key: string): Promise<boolean> {
  try {
    const result = await redis.set(key, 'locked', 'EX', LOCK_TTL, 'NX');
    return result === 'OK';
  } catch {
    console.error('Failed to acquire lock:', key);
    return false;
  }
}

export async function releaseLock(key: string): Promise<void> {
  try {
    await redis.del(key);
  } catch {
    console.error('Failed to release lock:', key);
  }
}

export default redis;
