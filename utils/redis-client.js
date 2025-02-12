// utils/redis-cleint.js

/**
 * * Redist Client
 * This the base redist client for the app
 */

const { createClient } = require("redis");
const logger = require("./logger");
const config = require("../config/config");

// 1. Create Redis Client
const redisClient = createClient({
  socket: {
    host: process.env.REDIS_HOST || "127.0.0.1",
    port: process.env.REDIS_PORT || 6379,
  },
  password: process.env.REDIS_PASSWORD || null,
});

// 2. Handle Connections to Redis
redisClient.on("error", (err) => logger.error("Redis Client Error", err));
redisClient.on("connect", () => logger.info("Connected to Redis"));

// 3. Ensure connection before exporting
(async () => {
  try {
    await redisClient.connect();
    logger.info("Redis connection established.");
  } catch (err) {
    logger.error("Redis connection failed:", err);
  }
})();

module.exports = redisClient;
