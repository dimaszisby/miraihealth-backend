// src/routes/metric.routes.ts

import { Router } from "express";
import {
  createMetric,
  getUserMetricLibraries,
  getUserDetailMetricById, 
  getMetricById,// Deprecated
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
import { AuthRequest } from "@/types/request.context";

// Schema validation
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
  generateDummyMetricsSchema,
} from "@/types/api/zod-metric.schema";

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
const metricCacheKey = (req: AuthRequest) =>
  `metric:${req.user?.id}:${req.params.id}:${req.query.include || "flat"}`;
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
  getUserDetailMetricById,
);

// Developer Note: This function is WAS deprecated due to API endpoint changes (from flat to query params structure), but will be reimplemented for metric details retrieval.
// Proposal for future development: getPublicMetricId -> Public metrics retrieval that could be used for public templates or shared metrics.
// { Code Here ...}

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
