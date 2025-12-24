import { createClient, RedisClientType } from "redis";
import logger from "./logger.js";
import { env } from "../config/envManager.js";

// Redis client configuration
const redisConfig = {
  socket: {
    host: env.REDIS_HOST || "127.0.0.1",
    port: Number(env.REDIS_PORT) || 6379,
    reconnectStrategy: (retries: number) => Math.min(retries * 50, 2000), // Progressive backoff
  },
  // Add password only if available
  ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
};

// Create Redis Client
const redisClient: RedisClientType = createClient(redisConfig);

const isTestEnv = env.NODE_ENV === "test";

// Gracefully handle Redis errors
redisClient.on("error", (err: Error) => {
  logger.error("[REDIS - ERROR] Redis Connection Error:", err);
  if (env.REDIS_REQUIRED && !isTestEnv) {
    process.exit(1);
  }
});

redisClient.on("connect", () => logger.info("[REDIS] Connected to Redis"));
redisClient.on("reconnecting", () =>
  logger.warn("[REDIS] Reconnecting to Redis..."),
);
redisClient.on("end", () => logger.warn("[REDIS] Redis connection closed."));

// Ensure connection before exporting
const connectRedis = async () => {
  try {
    const shouldConnect = !isTestEnv;

    if (shouldConnect) {
      await redisClient.connect();
      logger.info("[REDIS] Redis connection established.");
    } else {
      logger.info("[REDIS] Skipping Redis connection in test environment.");
    }
  } catch (err) {
    logger.error("[ERROR] Redis connection failed:", err);
    if (env.REDIS_REQUIRED) {
      process.exit(1);
    } else {
      logger.warn("[REDIS] Continuing without Redis connection.");
    }
  }
};

// Graceful Shutdown Hook
const disconnectRedis = async () => {
  try {
    if (!redisClient.isOpen) {
      logger.info("[PROCESS] Redis client already closed.");
      return;
    }
    await redisClient.quit();
    logger.info("[PROCESS] Redis client disconnected.");
  } catch (error) {
    logger.error("[ERROR] closing Redis connection:", error);
  }
};

/**
 * Invalidates the Redis cache for the given key.
 * @param key - The cache key to invalidate.
 */
const invalidateCache = async (key: string) => {
  if (redisClient.isOpen) {
    await redisClient.del(key);
    logger.info(`♻️ Cache invalidated for ${key}`);
  }
};

/**
 * Invalidates Redis cache keys matching a given pattern.
 * Uses SCAN to avoid blocking the server on large datasets.
 * @param pattern - The pattern to match cache keys (e.g., 'metrics:user123:*').
 */
const invalidateCacheByPattern = async (pattern: string) => {
  if (redisClient.isOpen) {
    let cursor = 0;
    do {
      const scanResult = await redisClient.scan(cursor, {
        MATCH: pattern,
        COUNT: 100, // Process 100 keys at a time
      });
      cursor = Number(scanResult.cursor);
      const keys = scanResult.keys;

      if (keys.length > 0) {
        await redisClient.del(keys);
        logger.info(`[CACHE] Pattern "${pattern}" deleted keys:`, keys);
      } else {
        logger.info(`[CACHE] Pattern "${pattern}" found NO keys to delete.`);
      }
    } while (cursor !== 0);
  }
};

// Auto-connect on import
connectRedis();

export {
  redisClient,
  disconnectRedis,
  invalidateCache,
  invalidateCacheByPattern,
};
