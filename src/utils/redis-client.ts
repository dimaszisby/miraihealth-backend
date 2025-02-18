import { createClient, RedisClientType } from "redis";
import logger from "./logger.js";  // Update the import path

/**
 * * Redis Client
 * This is the base Redis client for the app.
 */

// Redis client configuration
const redisConfig = {
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  // Only add password if it's configured
  ...(process.env.REDIS_PASSWORD && {
    password: process.env.REDIS_PASSWORD
  })
};

// Create Redis Client with conditional password
const redisClient: RedisClientType = createClient(redisConfig);

// Handle Connections to Redis
redisClient.on("error", (err: Error) => {
  logger.error("Redis Client Error:", err);
  // Don't throw error in test environment
  if (process.env.NODE_ENV !== 'test') {
    throw err;
  }
});

redisClient.on("connect", () => logger.info("Connected to Redis"));

// Ensure connection before exporting
const connectRedis = async () => {
  try {
    // Only connect if not in test environment or if explicitly required
    if (process.env.NODE_ENV !== 'test' || process.env.REDIS_REQUIRED === 'true') {
      await redisClient.connect();
      logger.info("Redis connection established.");
    } else {
      logger.info("Skipping Redis connection in test environment.");
    }
  } catch (err) {
    logger.error("Redis connection failed:", err);
    // Don't throw error in test environment
    if (process.env.NODE_ENV !== 'test') {
      throw err;
    }
  }
};

// Auto-connect on import
connectRedis();

export default redisClient;
