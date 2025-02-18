// src/middleware/cache-middleware.ts

import { Request, Response, NextFunction } from "express";
import redisClient from "../utils/redis-client.js";
import logger from "../utils/logger.js";

/**
 * * Cache Middleware
 * Caching responses using Redis for improved performance.
 */

export type KeyGenerator = (req: Request) => string;

/**
 * Middleware for caching API responses using Redis.
 * @param {KeyGenerator} keyGenerator - Function to generate cache keys
 * @param {number} duration - Cache duration in seconds
 */
export const cacheMiddleware =
  (keyGenerator: KeyGenerator, duration: number) =>
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    if (process.env.NODE_ENV === "test") {
      return next();
    }

    try {
      const key = keyGenerator(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`Cache hit for key: ${key}`);
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      logger.info(`Cache miss for key: ${key}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response
      res.json = (data: any) => {
        redisClient
          .setEx(key, duration, JSON.stringify(data))
          .then(() =>
            logger.info(`Cached response for key: ${key} (TTL: ${duration}s)`)
          )
          .catch((cacheError) =>
            logger.error(`Failed to cache response for key: ${key}`, cacheError)
          );

        return originalJson(data); // ✅ Ensure synchronous return
      };

      next();
    } catch (error) {
      logger.error("Cache middleware error:", error);
      next(); // Proceed without cache on error
    }
  };
