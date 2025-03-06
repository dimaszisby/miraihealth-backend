//src/routes/metric-log.routes.ts

import { Router } from "express";
import {
  createMetricLog,
  getAllLogsByMetric,
  getLogById,
  updateLog,
  deleteLog,
  getAggregatedStats,
} from "../controllers/metric-log.controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { cacheMiddleware } from "../middleware/cache-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  getAllMetricLogsSchema,
  getMetricLogSchema,
  deleteMetricLogSchema,
  getAggregatedStatsSchema,
} from "../validators/metric-log.validator.js";
import { userRateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

// Apply Authentication Middleware for all metric log routes
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID and log ID
 */
const logsCacheKey = (req: any) =>
  `logs:${req.user?.id}:${req.params.metricId}`;
const logCacheKey = (req: any) =>
  `log:${req.user?.id}:${req.params.metricId}:${req.params.id}`;
const logStatsCacheKey = (req: any) =>
  `logStats:${req.user?.id}:${req.params.metricId}`;

/**
 * * Logs Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 *
 */

// CREATE Log
router.post(
  "/:metricId/logs/",
  userRateLimiter,
  validate(createMetricLogSchema),
  createMetricLog
);

// GET All Logs by Metric Id
router.get(
  "/:metricId/logs/",
  validate(getAllMetricLogsSchema),
  cacheMiddleware(logsCacheKey, 300),
  getAllLogsByMetric
);

// GET Aggregated Stats for logs
// Should be palce before GET Specific Log by Id to avoid conflict
// In Express, routes are evaluated in the order they are defined
router.get(
  "/:metricId/logs/stats",
  validate(getAggregatedStatsSchema),
  cacheMiddleware(logStatsCacheKey, 300),
  getAggregatedStats
);

// GET Specific Log by Id
router.get(
  "/:metricId/logs/:id",
  validate(getMetricLogSchema),
  cacheMiddleware(logCacheKey, 300), // Cache a single log entry
  getLogById
);

// UPDATE Log
router.put(
  "/:metricId/logs/:id",
  userRateLimiter,
  validate(updateMetricLogSchema),
  updateLog
);

// DELETE Log
router.delete(
  "/:metricId/logs/:id",
  userRateLimiter,
  validate(deleteMetricLogSchema),
  deleteLog
);

export default router;
