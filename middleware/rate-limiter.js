/**
 * * Rate Limiter
 * There are two methods in this middleware:
 *  1. Global rate limiter -> based on IP address
 *  2. User Based Limier -> based on UserID
 */

// * Rate Limiter
// There are two methods in this middleware:
// 1.

const rateLimit = require("express-rate-limit");
const RedisStore = require("rate-limit-redis");
const { redisClient } = require("../utils/redis-client");
const logger = require("../utils/logger");

/**
 * * Global Rate Limiter
 * Applies to all routes
 */
const globalRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req, res, next, options) => {
    logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    res.status(options.statusCode).json(options.message);
  },
});

/**
 * * User-Based Rate Limiter
 * Applies to authenticated routes based on user ID
 */
const userRateLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args) => redisClient.sendCommand(args),
  }),

  // * Key generator
  //  Differentiates between authenticated and unauthenticated users.
  keyGenerator: (req) => (req.user ? `user:${req.user.id}` : req.ip),

  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each user to 200 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    status: 429,
    message: "Too many requests, please try again later.",
  },
  handler: (req, res, next, options) => {
    if (req.user) {
      logger.warn(`Rate limit exceeded for User ID: ${req.user.id}`);
    } else {
      logger.warn(`Rate limit exceeded for IP: ${req.ip}`);
    }
    res.status(options.statusCode).json(options.message);
  },
});

module.exports = {
  globalRateLimiter,
  userRateLimiter,
};
