import { createClient, RedisClientType } from "redis";
import logger from "@utils/logger.js";

/**
 * * Redis Client
 * This is the base Redis client for the app.
 */

// 1. Create Redis Client
const redisClient: RedisClientType = createClient({
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: Number(process.env.REDIS_PORT) || 6379,
  },
  password: process.env.REDIS_PASSWORD || undefined,
});

// 2. Handle Connections to Redis
redisClient.on("error", (err: Error) =>
  logger.error("Redis Client Error:", err)
);
redisClient.on("connect", () => logger.info("Connected to Redis"));

// 3. Ensure connection before exporting
const connectRedis = async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connection established.");
  } catch (err) {
    logger.error("Redis connection failed:", err);
  }
};

// Auto-connect on import
connectRedis();

export default redisClient;
