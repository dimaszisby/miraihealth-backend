import { Response, NextFunction } from "express";
import { redisClient } from "../utils/redis-client.js";
import logger from "../utils/logger.js";
import { env } from "../config/zodEnv.js";
import { AuthRequest } from "@/types/request.context.js";

export type KeyGenerator = (req: AuthRequest) => string;

/**
 * Middleware for caching API responses using Redis.
 * @param {KeyGenerator} keyGenerator - Function to generate cache keys
 * @param {number} duration - Cache duration in seconds
 */
export const cacheMiddleware =
  (keyGenerator: KeyGenerator, duration: number) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (env.NODE_ENV === "test") {
      return next();
    }

    try {
      // Generate cache key
      const key = keyGenerator(req);
      // Check if key exists in cache
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`[CACHE PROCESS] Cache HIT: ${key}`);
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      logger.info(`[CACHE ERROR] Cache miss for key: ${key}`);

      // Store original res.json function
      const originalJson = res.json.bind(res);

      // Override res.json to cache the response before sending
      res.json = (data: any) => {
        redisClient
          .setEx(key, duration, JSON.stringify(data))
          .then(() =>
            logger.info(`[CACHE] Cached response: ${key} (TTL: ${duration}s)`)
          )
          .catch((cacheError) =>
            logger.error(`[CACHE ERROR] Cache write failed: ${key}`, cacheError)
          );

        return originalJson(data);
      };

      next();
    } catch (error) {
      logger.error("[CACHE ERROR] Cache middleware error:", error);
      next();
    }
  };
