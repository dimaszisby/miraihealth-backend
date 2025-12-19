import { env } from "@/config/envManager";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Response, NextFunction } from "express";
import { redisClient } from "@/utils/redis-client";
import { AuthRequest } from "@/types/request.context";
import logger from "@/utils/logger";

const maybeCreateStore = () => {
  if (env.NODE_ENV === "test") return undefined;

  if (!env.REDIS_REQUIRED && !redisClient.isOpen) {
    logger.warn(
      "[RATE LIMITER] Redis not connected; falling back to in-memory store."
    );
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });
};

export const createGlobalRateLimiter = () =>
  rateLimit({
    store: maybeCreateStore(),
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_GLOBAL_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: "Too many requests, please try again later.",
    },
    handler: (req: AuthRequest, res: Response, next: NextFunction, options) => {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      res.status(options.statusCode).json(options.message);
    },
  });

export const globalRateLimiter = createGlobalRateLimiter();

export const createUserRateLimiter = () =>
  rateLimit({
    keyGenerator: (req: AuthRequest): string => {
      return req.user?.id ? `user:${req.user.id}` : req.ip || "anonymous";
    },
    store: maybeCreateStore(),
    windowMs: 15 * 60 * 1000,
    max: env.RATE_LIMIT_USER_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: "Too many requests, please try again later.",
    },
    handler: (req: AuthRequest, res: Response, next: NextFunction, options) => {
      if (req.user) {
        logger.warn(`Rate limit exceeded for User ID: ${req.user.id}`);
      } else {
        logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
      }
      res.status(options.statusCode).json(options.message);
    },
  });

export const userRateLimiter = createUserRateLimiter();

export const createAnalyticsRateLimiter = () =>
  rateLimit({
    keyGenerator: (req: AuthRequest): string => {
      return req.user?.id ? `analytics:${req.user.id}` : req.ip || "anonymous";
    },
    store: maybeCreateStore(),
    windowMs: 60 * 1000,
    max: env.RATE_LIMIT_ANALYTICS_MAX,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      status: 429,
      message: "Too many visualization requests, slow down.",
    },
    handler: (req: AuthRequest, res: Response, next: NextFunction, options) => {
      const identifier = req.user?.id ?? req.ip ?? "anonymous";
      logger.warn(`Analytics rate limit exceeded for ${identifier}`);
      res.status(options.statusCode).json(options.message);
    },
  });

export const analyticsRateLimiter = createAnalyticsRateLimiter();
