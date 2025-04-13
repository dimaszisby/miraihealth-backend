// src/routes/metric.routes.ts

import { Router } from "express";
import {
  createMetric,
  getAllMetrics,
  getUserDetailMetricById,
  updateMetric,
  deleteMetric,
} from "@/controllers/metric.controller";
import { getTrends } from "@/controllers/trend.controller";

// Middleware
import { authMiddleware } from "@/middleware/auth-middleware";
import { cacheMiddleware } from "@/middleware/cache-middleware";
import { validate } from "@/middleware/validate";
import { userRateLimiter } from "@/middleware/rate-limiter";

// Schema validation
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
} from "@/validators/metric.validator";

const router = Router();

// Apply Authentication Middleware for all metric routes
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID
 */
const metricsCacheKey = (req: any) => `metrics:${req.user?.id}`;
const metricCacheKey = (req: any) => `metric:${req.user?.id}:${req.params.id}`;

/**
 * * Metrics Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 */

// CREATE Metric
router.post("/", userRateLimiter, validate(createMetricSchema), createMetric);

// GET All Metric by User Id
router.get("/", cacheMiddleware(metricsCacheKey, 300), getAllMetrics);

// GET specific User owned Metric by ID with caching
router.get(
  "/:id",
  validate(getMetricSchema),
  cacheMiddleware(metricCacheKey, 300),
  getUserDetailMetricById
);

// UPDATE Metric
router.put("/:id", userRateLimiter, validate(updateMetricSchema), updateMetric);

// DELETE Metric
router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricSchema),
  deleteMetric
);

/**
 * * Trends Endpoint
 */

router.get("/:metricId/trends", getTrends);

export default router;
