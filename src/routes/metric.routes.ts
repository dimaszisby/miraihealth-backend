// src/routes/metric.routes.ts

import { Router } from "express";
import {
  createMetric,
  getUserMetricLibraries,
  getUserDetailMetricById, // Deprecated
  getMetricById,
  updateMetric,
  deleteMetric,
} from "@/controllers/metric.controller";
import { getTrends } from "@/controllers/trend.controller";
import { generateDummyMetrics } from "@/controllers/metric.controller";

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
  generateDummyMetricsSchema,
} from "@/validators/metric.validator";

const router = Router();

// Apply Authentication Middleware for all metric routes
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID
 */
const metricsCacheKey = (req: any) => {
  const page = req.query.page || 1;
  const limit = req.query.limit || 20;
  return `metrics:${req.user?.id}:page:${page}:limit:${limit}`;
};
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
router.get("/", cacheMiddleware(metricsCacheKey, 300), getUserMetricLibraries);

// GET specific Metric by ID with caching (new flat structure)
router.get(
  "/:id",
  validate(getMetricSchema),
  cacheMiddleware(metricCacheKey, 300),
  getMetricById
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

/**
 * * ===== Endpoints for Testing Purposes =====
 */

// Generate Dummy Metrics
router.post(
  "/dummy",
  userRateLimiter,
  validate(generateDummyMetricsSchema),
  generateDummyMetrics
);

export default router;
