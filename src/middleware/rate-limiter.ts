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
    return undefined;
  }

  if (!env.REDIS_REQUIRED && !redisClient.isOpen) {
    logger.warn(
      "[RATE LIMITER] Redis not connected; falling back to in-memory store."
    );
    return undefined;
  }

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
  max: env.RATE_LIMIT_GLOBAL_MAX,
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

/**
 * * Analytics Rate Limiter
 * Restricts expensive visualization queries.
 */
export const analyticsRateLimiter = rateLimit({
  keyGenerator: (req: AuthRequest): string => {
    return req.user?.id ? `analytics:${req.user.id}` : req.ip || "anonymous";
  },
  store: maybeCreateStore(),
  windowMs: 60 * 1000, // 1 minute
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
