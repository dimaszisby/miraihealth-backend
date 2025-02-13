import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Request, Response, NextFunction } from "express";
import redisClient from "../utils/redis-client.js";
import logger from "../utils/logger.js";

/**
 * * Rate Limiter Middleware
 * Provides two types of rate limiting:
 * 1. **Global Rate Limiter** -> Limits requests based on IP address.
 * 2. **User-Based Rate Limiter** -> Limits requests based on authenticated UserID.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Global Rate Limiter
 * Applies rate limiting to all routes based on IP address.
 */
export const globalRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per window
  standardHeaders: true, // Return rate limit info in `RateLimit-*` headers
  legacyHeaders: false, // Disable `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req: Request, res: Response, next: NextFunction, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * * User-Based Rate Limiter
 * Applies rate limiting to authenticated users based on their UserID.
 */
export const userRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),

  /**
   * * Key Generator
   * Differentiates between authenticated and unauthenticated users.
   * - If authenticated, rate limit is applied per `UserID`
   * - Otherwise, rate limit is applied per `IP address`
   */
  keyGenerator: (req: AuthRequest): string => {
    return req.user?.id ? `user:${req.user.id}` : req.ip || "anonymous";
  },

  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per window
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
