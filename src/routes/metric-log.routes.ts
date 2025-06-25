//src/routes/metric-log.routes.ts

import { Router } from "express";
import {
  createMetricLog,
  getAllLogsByMetric,
  getLogById,
  updateLog,
  deleteLog,
  getAggregatedStats,
  generateDummyMetricLogs,
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
  generateDummyMetricLogsSchema,
} from "../validators/metric-log.validator.js";
import { userRateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

/**
 * * Key Generator Function
 * Generates a cache key based on user ID and log ID
 */
const logsCacheKey = (req: any) => {
  const { metricId, page = 1, limit = 10, startDate, endDate, sortBy, order } = req.query;
  return `logs:${req.user?.id}:${metricId || "all"}:${page}:${limit}:${startDate}:${endDate}:${sortBy}:${order}`;
};
const logCacheKey = (req: any) =>
  `log:${req.user?.id}:${req.params.id}`;
const logStatsCacheKey = (req: any) =>
  `logStats:${req.user?.id}:${req.query.metricId || "all"}`;

// Middleware to add deprecation warning
const deprecateMetricLogRoute = (req: any, res: any, next: any) => {
  res.setHeader('X-Deprecated-Endpoint', 'true');
  res.setHeader('Link', '</api/v1/metric-logs>; rel="successor-version"; title="Use /api/v1/metric-logs instead"');
  console.warn(`DEPRECATED ACCESS: User ${req.user?.id} accessed deprecated metric log endpoint: ${req.originalUrl}`);
  next();
};

// Apply Authentication Middleware for all metric log routes
router.use(authMiddleware);

/**
 * * Deprecated Nested Routes (for backward compatibility)
 * These routes will be removed after a migration period.
 */

// DEPRECATED: CREATE Log
router.post(
  "/metrics/:metricId/logs/",
  deprecateMetricLogRoute,
  userRateLimiter,
  validate(createMetricLogSchema),
  createMetricLog
);

// DEPRECATED: GET All Logs by Metric Id
router.get(
  "/metrics/:metricId/logs/",
  deprecateMetricLogRoute,
  validate(getAllMetricLogsSchema),
  cacheMiddleware(logsCacheKey, 300),
  getAllLogsByMetric
);

// DEPRECATED: GET Aggregated Stats for logs
router.get(
  "/metrics/:metricId/logs/stats",
  deprecateMetricLogRoute,
  validate(getAggregatedStatsSchema),
  cacheMiddleware(logStatsCacheKey, 300),
  getAggregatedStats
);

// DEPRECATED: GET Specific Log by Id
router.get(
  "/metrics/:metricId/logs/:id",
  deprecateMetricLogRoute,
  validate(getMetricLogSchema),
  cacheMiddleware(logCacheKey, 300), // Cache a single log entry
  getLogById
);

// DEPRECATED: UPDATE Log
router.put(
  "/metrics/:metricId/logs/:id",
  deprecateMetricLogRoute,
  userRateLimiter,
  validate(updateMetricLogSchema),
  updateLog
);

// DEPRECATED: DELETE Log
router.delete(
  "/metrics/:metricId/logs/:id",
  deprecateMetricLogRoute,
  userRateLimiter,
  validate(deleteMetricLogSchema),
  deleteLog
);

// DEPRECATED: Generate Dummy Logs
router.post(
  "/metrics/:metricId/logs/dummy",
  deprecateMetricLogRoute,
  userRateLimiter,
  validate(generateDummyMetricLogsSchema),
  generateDummyMetricLogs
);

/**
 * * Logs Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 *
 */

// CREATE Log
router.post(
  "/",
  userRateLimiter,
  validate(createMetricLogSchema),
  createMetricLog
);

// GET All Logs (with optional metricId filter)
router.get(
  "/",
  validate(getAllMetricLogsSchema),
  cacheMiddleware(logsCacheKey, 300),
  getAllLogsByMetric
);

// GET Aggregated Stats for logs (with optional metricId filter)
router.get(
  "/stats",
  validate(getAggregatedStatsSchema),
  cacheMiddleware(logStatsCacheKey, 300),
  getAggregatedStats
);

// GET Specific Log by Id
router.get(
  "/:id",
  validate(getMetricLogSchema),
  cacheMiddleware(logCacheKey, 300), // Cache a single log entry
  getLogById
);

// UPDATE Log
router.put(
  "/:id",
  userRateLimiter,
  validate(updateMetricLogSchema),
  updateLog
);

// DELETE Log
router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricLogSchema),
  deleteLog
);

/**
 * * ===== Endpoints for Testing Purposes =====
 */

// Generate Dummy Logs
router.post(
  "/dummy",
  userRateLimiter,
  validate(generateDummyMetricLogsSchema),
  generateDummyMetricLogs
);

// Generate Dummy Logs for a specific metric (new endpoint)
router.post(
  "/:metricId/dummy",
  userRateLimiter,
  validate(generateDummyMetricLogsSchema),
  generateDummyMetricLogs
);

export default router;
