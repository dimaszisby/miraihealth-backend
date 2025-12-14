import { Router } from "express";
import {
  createMetricSettings,
  getMetricSettingsById,
  updateMetricSettings,
  deleteMetricSettings,
  updateGoalAchievement,
  updateDisplayOptions,
  getAllMetricSettingsViaCursor,
} from "./controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { cacheMiddleware } from "@/shared/middleware/cache";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
  getMetricSettingsSchema,
  deleteMetricSettingsSchema,
  listMetricSettingsViaCursorSchema,
  updateDisplayOptionsSchema,
  goalAchievementSchema,
} from "./schema.zod";
import { AuthRequest } from "@/types/request.context";
import logger from "@/utils/logger";
import { buildCursorCacheKey } from "@/shared/cache/keys";

const metricSettingsCacheKey = (req: AuthRequest) =>
  `metricSettings:${req.user?.id}:${req.query.metricId || "all"}`;

const metricSettingCacheKey = (req: AuthRequest) =>
  `metricSetting:${req.user?.id}:${req.params.id}`;

const firstNonEmpty = (...vals: unknown[]) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) as
    | string
    | undefined;

const bool01 = (v: any) => (v === true || v === "true" ? "1" : "0");

const METRIC_SETTINGS_CURSOR_FEATURE = "metric-settings";
const METRIC_SETTINGS_CURSOR_VERSION = 1;

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

  const key = buildCursorCacheKey({
    feature: METRIC_SETTINGS_CURSOR_FEATURE,
    version: METRIC_SETTINGS_CURSOR_VERSION,
    userId: req.user?.id,
    segments: [
      ["l", limit],
      ["s", sort],
      ["fm", metricId],
      ["after", after],
      ["it", it],
    ],
  });

  logger.debug("[CACHE] Generated metric settings cursor key", { key });
  return key;
};

export const createMetricSettingsRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.get(
    "/",
    validate(listMetricSettingsViaCursorSchema),
    cacheMiddleware(metricSettingsCursorCacheKey, 300),
    getAllMetricSettingsViaCursor
  );

  router.get(
    "/:id",
    validate(getMetricSettingsSchema),
    cacheMiddleware(metricSettingCacheKey, 300),
    getMetricSettingsById
  );

  router.post(
    "/",
    userRateLimiter,
    validate(createMetricSettingsSchema),
    createMetricSettings
  );

  router.put(
    "/:id",
    userRateLimiter,
    validate(updateMetricSettingsSchema),
    updateMetricSettings
  );

  router.delete(
    "/:id",
    userRateLimiter,
    validate(deleteMetricSettingsSchema),
    deleteMetricSettings
  );

  router.patch(
    "/:id/achieve",
    userRateLimiter,
    validate(goalAchievementSchema),
    updateGoalAchievement
  );

  router.patch(
    "/:id/display",
    userRateLimiter,
    validate(updateDisplayOptionsSchema),
    updateDisplayOptions
  );

  return router;
};

export const metricSettingsRouter = createMetricSettingsRouter();
