import { Router } from "express";
import {
  createMetricSettings,
  getMetricSettingsById,
  updateMetricSettings,
  deleteMetricSettings,
  updateGoalAchievement,
  updateDisplayOptions,
  getAllMetricSettingsViaCursor,
} from "@/controllers/metric-settings.controller.js";
import { authMiddleware } from "@/middleware/auth-middleware.js";
import { cacheMiddleware } from "@/middleware/cache-middleware.js";
import { userRateLimiter } from "@/middleware/rate-limiter.js";
import { validate } from "@/middleware/validate.js";
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
  listMetricSettingsViaCursorSchema,
} from "@/types/api/zod-metric-settings.schema.js";
import { z } from "zod";
import { AuthRequest } from "@/types/request.context";
import logger from "@/utils/logger";

const router = Router();

/**
 * Offset
 * @deprecated migrate to cursor based
 */
const metricSettingsCacheKey = (req: any) =>
  `metricSettings:${req.user?.id}:${req.query.metricId || "all"}`;

const metricSettingCacheKey = (req: any) =>
  `metricSetting:${req.user?.id}:${req.params.id}`;

// TODO: Refactor
const firstNonEmpty = (...vals: unknown[]) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) as
    | string
    | undefined;

// TODO: Refactor
const bool01 = (v: any) => (v === true || v === "true" ? "1" : "0");

const patchParams = { params: z.object({ id: z.string().uuid() }) };

// Cursor List Cache Key
const metricSettingsCursorCacheKey = (req: AuthRequest) => {
  const q = req.query as any;
  const filter = (q && typeof q.filter === "object" && q.filter) || {};

  const metricId =
    firstNonEmpty(
      filter.metricId,
      q["filter[metricId]"],
      q.metricId,
      req.params?.metricId
    ) ?? "_";

  const limit = Number(q.limit ?? 20);
  const sort = String(q.sort ?? "-createdAt");
  const after = typeof q.after === "string" ? q.after : "";
  const it = bool01(q.includeTotal);

  const key = [
    "metric-settings-cursor:v1",
    req.user?.id ?? "_",
    `l:${limit}`,
    `s:${sort}`,
    `fm:${metricId}`,
    `after:${after}`,
    `it:${it}`,
  ].join(":");

  logger.debug("[CACHE] Generated metric settings cursor key", { key });
  return key;
};

// Global Auth
router.use(authMiddleware);

// * =========== Query Endpoints ===========

// GET All Settings (with optional metricId filter)
router.get(
  "/",
  validate(listMetricSettingsViaCursorSchema),
  cacheMiddleware(metricSettingsCursorCacheKey, 300),
  getAllMetricSettingsViaCursor // This will be replaced with listMetricSettingsViaCursor
);

// GET Specific Settings by Id
router.get(
  "/:id",
  validate(getMetricSettingsSchema),
  cacheMiddleware(metricSettingCacheKey, 300),
  getMetricSettingsById
);

// * =========== Commands Endpoints ===========

// CREATE Settings
router.post(
  "/",
  userRateLimiter,
  validate(createMetricSettingsSchema),
  createMetricSettings
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
