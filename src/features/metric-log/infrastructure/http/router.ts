import { Router } from "express";
import {
  createMetricLog,
  getLogById,
  updateLog,
  deleteLog,
  getAggregatedStats,
  generateDummyMetricLogs,
  getUserLogLibrariesViaCursor,
} from "./controller.js";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware.js";
import { cacheMiddleware } from "@/shared/middleware/cache.js";
import { userRateLimiter } from "@/shared/middleware/rate-limiter.js";
import { validate } from "@/shared/middleware/validation.js";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  getMetricLogByIdSchema,
  deleteMetricLogSchema,
  getAggregatedStatsSchema,
  generateDummyMetricLogsSchema,
  listMetricLogsViaCursorSchema,
} from "./schema.zod.js";
import { AuthRequest } from "@/types/request.context.js";
import { env } from "@/config/envManager.js";
import logger from "@/utils/logger.js";
import { buildCursorCacheKey } from "@/shared/cache/keys.js";

const firstNonEmpty = (...vals: unknown[]) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) as
    | string
    | undefined;

const bool01 = (v: any) => (v === true || v === "true" ? "1" : "0");

const logCacheKey = (req: AuthRequest) =>
  `log:${req.user?.id}:${req.params.id}`;

const METRIC_LOG_CURSOR_FEATURE = "metric-logs.js";
const METRIC_LOG_CURSOR_VERSION = 2;

const logsCursorCacheKey = (req: AuthRequest) => {
  const q = req.query as any;
  const filter = (q && typeof q.filter === "object" && q.filter) || {};

  const metricId =
    firstNonEmpty(
      filter.metricId,
      q["filter[metricId]"],
      q.metricId,
      req.params?.metricId,
    ) ?? "_.js";

  const logValueStr =
    firstNonEmpty(
      String(filter.logValue ?? ""),
      String(q["filter[logValue]"] ?? ""),
    ) ?? "_.js";

  const limit = Number(q.limit ?? 20);
  const sort = String(q.sort ?? "-createdAt");
  const search = typeof q.q === "string" ? q.q.trim() : ".js";
  const after = typeof q.after === "string" ? q.after : ".js";
  const it = bool01(q.includeTotal);

  const key = buildCursorCacheKey({
    feature: METRIC_LOG_CURSOR_FEATURE,
    version: METRIC_LOG_CURSOR_VERSION,
    userId: req.user?.id,
    segments: [
      ["l", limit],
      ["s", sort],
      ["q", search],
      ["fm", metricId],
      ["fn", logValueStr],
      ["after", after],
      ["it", it],
    ],
  });

  logger.debug("[CACHE] Generated logs cursor key", { key });
  return key;
};

const logStatsCacheKey = (req: AuthRequest) => {
  const metricId = req.params.metricId || req.query.metricId;
  return `logStats:${req.user?.id}:${metricId || "all"}`;
};

export const createMetricLogRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.get(
    "/",
    validate(listMetricLogsViaCursorSchema),
    cacheMiddleware(logsCursorCacheKey, 300),
    getUserLogLibrariesViaCursor,
  );

  router.get(
    "/stats",
    validate(getAggregatedStatsSchema),
    cacheMiddleware(logStatsCacheKey, 300),
    getAggregatedStats,
  );

  router.get(
    "/:id",
    validate(getMetricLogByIdSchema),
    cacheMiddleware(logCacheKey, 300),
    getLogById,
  );

  router.post(
    "/",
    userRateLimiter,
    validate(createMetricLogSchema),
    createMetricLog,
  );

  router.put(
    "/:id",
    userRateLimiter,
    validate(updateMetricLogSchema),
    updateLog,
  );

  router.delete(
    "/:id",
    userRateLimiter,
    validate(deleteMetricLogSchema),
    deleteLog,
  );

  if (env.ENABLE_DUMMY_ENDPOINTS) {
    router.post(
      "/:metricId/dummy",
      userRateLimiter,
      validate(generateDummyMetricLogsSchema),
      generateDummyMetricLogs,
    );
  }

  return router;
};

export const metricLogRouter = createMetricLogRouter();
