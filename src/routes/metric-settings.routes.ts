// src/routes/metric-settings.routes.ts

import { Router } from "express";
import {
  createMetricSettings,
  getAllMetricSettings,
  getMetricSettingsById,
  updateMetricSettings,
  deleteMetricSettings,
  updateGoalAchievement,
  updateDisplayOptions,
} from "../controllers/metric-settings.controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { cacheMiddleware } from "../middleware/cache-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
} from "../validators/metric-settings.validator.js";
import { userRateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

// Apply Authentication Middleware Globally
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID, metric ID, and settings ID
 */
const metricSettingsCacheKey = (req: any) =>
  `metricSettings:${req.user?.id}:${req.params.metricId}`;
const metricSettingCacheKey = (req: any) =>
  `metricSetting:${req.user?.id}:${req.params.metricId}:${req.params.id}`;
const goalStatsCacheKey = (req: any) =>
  `goalStats:${req.user?.id}:${req.params.metricId}`;

/**
 * * Metric Settings Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 *
 */

// CREATE Settings
router.post(
  "/:metricId/settings/",
  userRateLimiter,
  validate(createMetricSettingsSchema),
  createMetricSettings
);

// GET All Settings by Metric Id
router.get(
  "/:metricId/settings/",
  validate(getAllMetricSettingsSchema),
  cacheMiddleware(metricSettingsCacheKey, 300),
  getAllMetricSettings
);

// GET Specific Settings by Id
router.get(
  "/:metricId/settings/:id",
  validate(getMetricSettingsSchema),
  cacheMiddleware(metricSettingCacheKey, 300),
  getMetricSettingsById
);

// UPDATE Settings
router.put(
  "/:metricId/settings/:id",
  userRateLimiter,
  validate(updateMetricSettingsSchema),
  updateMetricSettings
);

// DELETE Settings
router.delete(
  "/:metricId/settings/:id",
  userRateLimiter,
  validate(deleteMetricSettingsSchema),
  deleteMetricSettings
);

// New PATCH endpoints
router.patch(
  "/:metricId/settings/:id/achieve",
  userRateLimiter,
  updateGoalAchievement
);
router.patch(
  "/:metricId/settings/:id/display",
  userRateLimiter,
  updateDisplayOptions
);

export default router;
