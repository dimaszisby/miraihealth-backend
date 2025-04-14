// src/utils/redis-client.ts

import { createClient, RedisClientType } from "redis";
import logger from "./logger.js"; // Update the import path
import { env } from "../config/zodEnv.js";

/**
 * * Redis Client
 * This is the base Redis client for the app.
 */

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

// Gracefully handle Redis errors
redisClient.on("error", (err: Error) => {
  logger.error("❌ Redis Connection Error:", err);
    process.exit(1); // Exit in production if Redis is critical
});

redisClient.on("connect", () => logger.info("✅ Connected to Redis"));
redisClient.on("reconnecting", () =>
  logger.warn("♻️ Reconnecting to Redis...")
);
redisClient.on("end", () => logger.warn("🚨 Redis connection closed."));

// Ensure connection before exporting
const connectRedis = async () => {
  try {
    // Only connect if not in test environment or if explicitly required
    if (env.REDIS_REQUIRED) {
      await redisClient.connect();
      logger.info("✅ Redis connection established.");
    } else {
      logger.info("🔍 Skipping Redis connection in test environment.");
    }
  } catch (err) {
    logger.error("❌ Redis connection failed:", err);
    if (env.NODE_ENV !== "test") {
      process.exit(1);
    }
  }
};

// Graceful Shutdown Hook
const disconnectRedis = async () => {
  try {
    await redisClient.quit();
    logger.info("🚀 Redis client disconnected.");
  } catch (error) {
    logger.error("❌ Error closing Redis connection:", error);
  }
};

/**
 * Invalidates the Redis cache for the given key.
 * @param key - The cache key to invalidate.
 */
const invalidateCache = async (key: string) => {
  if (redisClient.isOpen) {
    await invalidateCache(key);
    logger.info(`♻️ Cache invalidated for ${key}`);
  }
};

// Auto-connect on import
connectRedis();

export { redisClient, disconnectRedis, invalidateCache };
