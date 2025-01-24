// backend/src/middleware/cacheMiddleware.js

// * Cache Middleware
// Caching using redis

const { getAsync, setAsync } = require("../utils/redis-client");
const logger = require("../utils/logger");

/**
 * Cache Middleware
 * @param {string} key - The Redis key for caching
 * @param {number} duration - Cache duration in seconds
 */

const cacheMiddleware = (keyGenerator, duration) => async (req, res, next) => {
  try {
    const key = keyGenerator(req);
    const cachedData = await getAsync(key);
    if (cachedData) {
      logger.info(`Cache hit for key: ${key}`);
      return res.status(200).json(JSON.parse(cachedData));
    }
    logger.info(`Cache miss for key: ${key}`);
    // Override res.json to cache the response
    const originalJson = res.json.bind(res);
    res.json = async (data) => {
      await setAsync(key, JSON.stringify(data), "EX", duration);
      return originalJson(data);
    };
    next();
  } catch (error) {
    logger.error("Cache middleware error:", error);
    next(); // Proceed without caching on error
  }
};

module.exports = cacheMiddleware;
