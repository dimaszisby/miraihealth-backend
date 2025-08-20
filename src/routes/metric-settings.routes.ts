// src/routes/metric-settings.routes.ts

import { Router } from "express";

// Controllers
import {
  createMetricSettings,
  getAllMetricSettings,
  getMetricSettingsById,
  updateMetricSettings,
  deleteMetricSettings,
  updateGoalAchievement,
  updateDisplayOptions,
} from "@/controllers/metric-settings.controller.js";

// Middleware
import { authMiddleware } from "@/middleware/auth-middleware.js";
import { cacheMiddleware } from "@/middleware/cache-middleware.js";
import { userRateLimiter } from "@/middleware/rate-limiter.js";
import { validate } from "@/middleware/validate.js";

// Schema validation
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getAllMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
} from "@/types/api/zod-metric-settings.schema.js";
import { z } from "zod";

const router = Router();

const metricSettingsCacheKey = (req: any) =>
  `metricSettings:${req.user?.id}:${req.query.metricId || "all"}`;
const metricSettingCacheKey = (req: any) =>
  `metricSetting:${req.user?.id}:${req.params.id}`;
const goalStatsCacheKey = (req: any) =>
  `goalStats:${req.user?.id}:${req.query.metricId || "all"}`;

// Middleware to add deprecation warning
const deprecateMetricSettingsRoute = (req: any, res: any, next: any) => {
  res.setHeader("X-Deprecated-Endpoint", "true");
  res.setHeader(
    "Link",
    '</api/v1/metric-settings>; rel="successor-version"; title="Use /api/v1/metric-settings instead"'
  );
  console.warn(
    `DEPRECATED ACCESS: User ${req.user?.id} accessed deprecated metric settings endpoint: ${req.originalUrl}`
  );
  next();
};

const patchParams = { params: z.object({ id: z.string().uuid() }) };

// Apply Authentication Middleware Globally
router.use(authMiddleware);

/**
 * * Deprecated Nested Routes (for backward compatibility)
 * These routes will be removed after a migration period.
 */

// DEPRECATED: CREATE Settings
router.post(
  "/metrics/:metricId/settings/",
  deprecateMetricSettingsRoute,
  userRateLimiter,
  validate(createMetricSettingsSchema),
  createMetricSettings
);

// DEPRECATED: GET All Settings by Metric Id
router.get(
  "/metrics/:metricId/settings/",
  deprecateMetricSettingsRoute,
  validate(getAllMetricSettingsSchema),
  cacheMiddleware(metricSettingsCacheKey, 300),
  getAllMetricSettings
);

// DEPRECATED: GET Specific Settings by Id
router.get(
  "/metrics/:metricId/settings/:id",
  deprecateMetricSettingsRoute,
  validate(getMetricSettingsSchema),
  cacheMiddleware(metricSettingCacheKey, 300),
  getMetricSettingsById
);

// DEPRECATED: UPDATE Settings
router.put(
  "/metrics/:metricId/settings/:id",
  deprecateMetricSettingsRoute,
  userRateLimiter,
  validate(updateMetricSettingsSchema),
  updateMetricSettings
);

// DEPRECATED: DELETE Settings
router.delete(
  "/metrics/:metricId/settings/:id",
  deprecateMetricSettingsRoute,
  userRateLimiter,
  validate(deleteMetricSettingsSchema),
  deleteMetricSettings
);

// DEPRECATED: New PATCH endpoints
router.patch(
  "/metrics/:metricId/settings/:id/achieve",
  deprecateMetricSettingsRoute,
  userRateLimiter,
  updateGoalAchievement
);
router.patch(
  "/metrics/:metricId/settings/:id/display",
  deprecateMetricSettingsRoute,
  userRateLimiter,
  updateDisplayOptions
);

/**
 * * Metric Settings Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 *
 */

// CREATE Settings
router.post(
  "/",
  userRateLimiter,
  validate(createMetricSettingsSchema),
  createMetricSettings
);

// GET All Settings (with optional metricId filter)
router.get(
  "/",
  validate(getAllMetricSettingsSchema),
  cacheMiddleware(metricSettingsCacheKey, 300),
  getAllMetricSettings
);

// GET Specific Settings by Id
router.get(
  "/:id",
  validate(getMetricSettingsSchema),
  cacheMiddleware(metricSettingCacheKey, 300),
  getMetricSettingsById
);

// UPDATE Settings
router.put(
  "/:id",
  userRateLimiter,
  validate(updateMetricSettingsSchema),
  updateMetricSettings
);

// DELETE Settings
router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricSettingsSchema),
  deleteMetricSettings
);

// New PATCH endpoints
router.patch(
  "/:id/achieve",
  userRateLimiter,
  validate(patchParams as any),
  updateGoalAchievement
);
router.patch(
  "/:id/display",
  userRateLimiter,
  validate(patchParams as any),
  updateDisplayOptions
);

export default router;
