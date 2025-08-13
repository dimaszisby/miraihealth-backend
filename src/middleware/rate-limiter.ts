// src/rate-limiter.ts

import { env } from "../config/zodEnv.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redis-client.js";
import { AuthRequest } from "../types/request.context.js";
import logger from "../utils/logger.js";

/**
 * * Rate Limiter Middleware
 * Provides two types of rate limiting:
 * 1. **Global Rate Limiter** -> Limits requests based on IP address.
 * 2. **User-Based Rate Limiter** -> Limits requests based on authenticated UserID.
 */

/**
 * If we are in test mode, let's skip using Redis-based rate-limiter
 * or at least set a huge limit.
 */
function maybeCreateStore() {
  if (env.NODE_ENV === "test") {
    // Return undefined to use the built-in in-memory store instead
    // or you could do: return new MemoryStore();
    return undefined;
  }
  // Otherwise, use Redis
  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });
}

/**
 * * Global Rate Limiter
 * Applies rate limiting to all routes based on IP address.
 */
export const globalRateLimiter = rateLimit({
  store: maybeCreateStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "test" || env.NODE_ENV === "development" ? 999999 : 50, // Limit each IP to 100 requests per window, but 999999 in test mode
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req: AuthRequest, res: Response, next: NextFunction, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * * User-Based Rate Limiter
 * Applies rate limiting to authenticated users based on their UserID.
 */
export const userRateLimiter = rateLimit({
  /**
   * * Key Generator
   * Differentiates between authenticated and unauthenticated users.
   * - If authenticated, rate limit is applied per `UserID`
   * - Otherwise, rate limit is applied per `IP address`
   */
  keyGenerator: (req: AuthRequest): string => {
    return req.user?.id ? `user:${req.user.id}` : req.ip || "anonymous";
  },
  store: maybeCreateStore(),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: env.NODE_ENV === "test" ? 999999 : 50, // Limit each user to 50 requests per window, but 999999 in test mode
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
