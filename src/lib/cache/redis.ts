import Redis from 'ioredis';

type RedisClient = Redis | null;

const globalForRedis = globalThis as unknown as {
  redis: RedisClient | undefined;
  inMemoryLocks: Map<string, number> | undefined;
};

function getInMemoryLocks(): Map<string, number> {
  if (!globalForRedis.inMemoryLocks) {
    globalForRedis.inMemoryLocks = new Map<string, number>();
  }
  return globalForRedis.inMemoryLocks;
}

function createRedisClient(): RedisClient {
  if (!process.env.REDIS_URL) {
    console.warn('REDIS_URL not set; Redis cache/locks disabled. Falling back to in-memory best-effort.');
    return null;
  }
  return new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: 3 });
}

export const redis: RedisClient = globalForRedis.redis ?? createRedisClient();

if (process.env.NODE_ENV !== 'production') globalForRedis.redis = redis;

// Lock utilities for settlement engine
const LOCK_TTL_SECONDS = 300; // 5 minutes
const LOCK_TTL_MS = LOCK_TTL_SECONDS * 1000;

export async function acquireLock(key: string): Promise<boolean> {
  // Try Redis first if available
  if (redis) {
    try {
      const result = await redis.set(key, 'locked', 'EX', LOCK_TTL_SECONDS, 'NX');
      return result === 'OK';
    } catch (err) {
      console.error('Failed to acquire Redis lock:', key, err);
      // Fall through to in-memory lock
    }
  }

  // Fallback to in-memory lock (single process only)
  const locks = getInMemoryLocks();
  const expiry = locks.get(key);
  const now = Date.now();
  if (expiry && expiry > now) {
    return false; // Lock still held
  }
  locks.set(key, now + LOCK_TTL_MS);
  return true;
}

export async function releaseLock(key: string): Promise<void> {
  // Try Redis first if available
  if (redis) {
    try {
      await redis.del(key);
      return;
    } catch (err) {
      console.error('Failed to release Redis lock:', key, err);
      // Fall through to in-memory cleanup
    }
  }

  // Fallback to in-memory lock removal
  getInMemoryLocks().delete(key);
}

export default redis;
