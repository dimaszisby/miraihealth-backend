// middleware/cacheMiddleware.js

/**
 * * Cache Middleware
 * Caching using redis
 */

const redisClient = require("../utils/redis-client");
const logger = require("../utils/logger");

/**
 * Cache Middleware
 * @param {Function} keyGenerator - Function to generate the cache key
 * @param {number} duration - Cache duration in seconds
 */
const cacheMiddleware = (keyGenerator, duration) => async (req, res, next) => {
  try {
    const key = keyGenerator(req);
    const cachedData = await redisClient.get(key); // Use redisClient.get() directly

    if (cachedData) {
      logger.info(`Cache hit for key: ${key}`);
      return res.status(200).json(JSON.parse(cachedData));
    }

    logger.info(`Cache miss for key: ${key}`);

    // Override res.json to store response in cache
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      await redisClient.setEx(key, duration, JSON.stringify(data)); // Use setEx for expiry
      return originalJson(data);
    };

    next();
  } catch (error) {
    logger.error("Cache middleware error:", error);
    next(); // Proceed without cache on error
  }
};

module.exports = cacheMiddleware;
