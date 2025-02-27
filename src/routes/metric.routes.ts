// src/routes/metric-routes.ts

import { Router } from "express";
import {
  createMetric,
  getAllMetrics,
  getMetricById,
  updateMetric,
  deleteMetric,
} from "../controllers/metric.controller.js";
import { getTrends } from "../controllers/trend-controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { cacheMiddleware } from "../middleware/cache-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
} from "../validators/metric.validator.js";

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
 */
// CREATE Metric
router.post("/", validate(createMetricSchema), createMetric);

// GET All Metric by User Id
router.get("/", cacheMiddleware(metricsCacheKey, 300), getAllMetrics);

// GET specific Metric by ID with caching
router.get(
  "/:id",
  validate(getMetricSchema),
  cacheMiddleware(metricCacheKey, 300),
  getMetricById
);

// UPDATE Metric
router.put("/:id", validate(updateMetricSchema), updateMetric);

// DELETE Metric
router.delete("/:id", validate(deleteMetricSchema), deleteMetric);

/**
 * * Trends Endpoint
 */

router.get("/:metricId/trends", getTrends);

export default router;
