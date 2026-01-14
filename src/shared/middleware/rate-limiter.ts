import { env } from "@/config/envManager.js";
import rateLimit from "express-rate-limit";
import RedisStore from "rate-limit-redis";
import { Response, NextFunction, type RequestHandler } from "express";
import { redisClient } from "@/utils/redis-client.js";
import { AuthRequest } from "@/types/request.context.js";
import logger from "@/utils/logger.js";

const noopRateLimiter: RequestHandler = (_req, _res, next) => next();
let disableNoticeLogged = false;

const maybeLogDisableNotice = () => {
  if (env.DISABLE_RATE_LIMITING && !disableNoticeLogged) {
    logger.info(
      "[RATE LIMITER] DISABLE_RATE_LIMITING=true — skipping throttling (contract tests / fuzzing runs).",
    );
    disableNoticeLogged = true;
  }
};

const maybeCreateStore = () => {
  if (env.NODE_ENV === "test") return undefined;

  if (!env.REDIS_REQUIRED && !redisClient.isOpen) {
    logger.warn(
      "[RATE LIMITER] Redis not connected; falling back to in-memory store.",
    );
    return undefined;
  }

  return new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  });
};

export const createGlobalRateLimiter = () =>
  env.DISABLE_RATE_LIMITING
    ? (maybeLogDisableNotice(), noopRateLimiter)
    : rateLimit({
        store: maybeCreateStore(),
        windowMs: 15 * 60 * 1000,
        max: env.RATE_LIMIT_GLOBAL_MAX,
        standardHeaders: true,
        legacyHeaders: false,
        message: {
          status: 429,
          message: "Too many requests, please try again later.",
        },
        handler: (
          req: AuthRequest,
          res: Response,
          next: NextFunction,
          options,
        ) => {
          logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
          res.status(options.statusCode).json(options.message);
        },
      });

export const globalRateLimiter = createGlobalRateLimiter();

export const createUserRateLimiter = () =>
  env.DISABLE_RATE_LIMITING
    ? (maybeLogDisableNotice(), noopRateLimiter)
    : rateLimit({
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
        handler: (
          req: AuthRequest,
          res: Response,
          next: NextFunction,
          options,
        ) => {
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
  env.DISABLE_RATE_LIMITING
    ? (maybeLogDisableNotice(), noopRateLimiter)
    : rateLimit({
        keyGenerator: (req: AuthRequest): string => {
          return req.user?.id
            ? `analytics:${req.user.id}`
            : req.ip || "anonymous";
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
        handler: (
          req: AuthRequest,
          res: Response,
          next: NextFunction,
          options,
        ) => {
          const identifier = req.user?.id ?? req.ip ?? "anonymous";
          logger.warn(`Analytics rate limit exceeded for ${identifier}`);
          res.status(options.statusCode).json(options.message);
        },
      });

export const analyticsRateLimiter = createAnalyticsRateLimiter();
