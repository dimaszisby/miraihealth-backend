import { Response, NextFunction } from "express";
import { redisClient } from "@/utils/redis-client.js";
import logger from "@/utils/logger.js";
import { env } from "@/config/envManager.js";
import { AuthRequest } from "@/types/request.context.js";

export type KeyGenerator = (req: AuthRequest) => string;

export type CacheMiddlewareOptions = {
  /** Skip cache middleware in test environments (default: true) */
  disableInTest?: boolean;
};

export const cacheMiddleware =
  (
    keyGenerator: KeyGenerator,
    duration: number,
    options: CacheMiddlewareOptions = {},
  ) =>
  async (
    req: AuthRequest,
    res: Response,
    next: NextFunction,
  ): Promise<void> => {
    const disableInTest = options.disableInTest ?? true;
    if (disableInTest && env.NODE_ENV === "test") {
      return next();
    }

    try {
      const key = keyGenerator(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`[CACHE PROCESS] Cache HIT: ${key}`);
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      logger.info(`[CACHE PROCESS] Cache miss for key: ${key}`);

      const originalJson = res.json.bind(res);
      res.json = ((data: unknown) => {
        redisClient
          .setEx(key, duration, JSON.stringify(data))
          .then(() =>
            logger.info(`[CACHE] Cached response: ${key} (TTL: ${duration}s)`),
          )
          .catch((cacheError) =>
            logger.error(
              `[CACHE ERROR] Cache write failed: ${key}`,
              cacheError,
            ),
          );

        return originalJson(data);
      }) as typeof res.json;

      next();
    } catch (error) {
      logger.error("[CACHE ERROR] Cache middleware error:", error);
      next();
    }
  };

export default cacheMiddleware;
