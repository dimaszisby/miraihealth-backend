import { Response, NextFunction } from "express";
import { redisClient } from "@/utils/redis-client";
import logger from "@/utils/logger";
import { env } from "@/config/zodEnv";
import { AuthRequest } from "@/types/request.context";

export type KeyGenerator = (req: AuthRequest) => string;

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
      const key = keyGenerator(req);
      const cachedData = await redisClient.get(key);

      if (cachedData) {
        logger.info(`[CACHE PROCESS] Cache HIT: ${key}`);
        res.status(200).json(JSON.parse(cachedData));
        return;
      }

      logger.info(`[CACHE PROCESS] Cache miss for key: ${key}`);

      const originalJson = res.json.bind(res);
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

export default cacheMiddleware;
