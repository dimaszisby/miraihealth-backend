import { Router } from "express";
import {
  createMetricLog,
  getLogById,
  updateLog,
  deleteLog,
  getAggregatedStats,
  generateDummyMetricLogs,
  getUserLogLibrariesViaCursor,
} from "@/controllers/metric-log.controller.js";
import { authMiddleware } from "@/middleware/auth-middleware.js";
import { cacheMiddleware } from "@/middleware/cache-middleware.js";
import { userRateLimiter } from "@/middleware/rate-limiter.js";
import { validate } from "@/middleware/validate.js";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  getMetricLogByIdSchema,
  deleteMetricLogSchema,
  getAggregatedStatsSchema,
  generateDummyMetricLogsSchema,
  listMetricLogsViaCursorSchema,
} from "@/types/api/zod-metric-log.schema.js";
import { AuthRequest } from "@/types/request.context";

const router = Router();

/**
 * * Key Generator Function
 * Generates a cache key based on user ID and log ID
 */

// TODO: Refactor
const firstNonEmpty = (...vals: unknown[]) =>
  vals.find((v) => typeof v === "string" && v.trim().length > 0) as
    | string
    | undefined;

// TODO: Refactor
const bool01 = (v: any) => (v === true || v === "true" ? "1" : "0");

// Singular Log Cache Key
const logCacheKey = (req: AuthRequest) =>
  `log:${req.user?.id}:${req.params.id}`;

// Cursor List Cache Key
const logsCursorCacheKey = (req: AuthRequest) => {
  const q = req.query as any;
  const filter = (q && typeof q.filter === "object" && q.filter) || {};

  // Prefer the canonical nested value; fall back to bracket/flat/param; ignore empty strings
  const metricId =
    firstNonEmpty(
      filter.metricId,
      q["filter[metricId]"],
      q.metricId,
      req.params?.metricId
    ) ?? "_";

  // Optional second filter (keep behavior consistent)
  const logValueStr =
    firstNonEmpty(
      String(filter.logValue ?? ""),
      String(q["filter[logValue]"] ?? "")
    ) ?? "_";

  const limit = Number(q.limit ?? 20);
  const sort = String(q.sort ?? "-createdAt");
  const search = typeof q.q === "string" ? q.q.trim() : "";
  const after = typeof q.after === "string" ? q.after : "";
  const it = bool01(q.includeTotal);

  const key = [
    "logs-cursor:v2", // new prefix
    req.user?.id ?? "_",
    `l:${limit}`,
    `s:${sort}`,
    `q:${search}`,
    `fm:${metricId}`,
    `fn:${logValueStr}`,
    `after:${after}`,
    `it:${it}`,
  ].join(":");

  console.log("[cache:key]", key);
  return key;
};

// User Log Stats Cache Key
const logStatsCacheKey = (req: AuthRequest) => {
  const metricId = req.params.metricId || req.query.metricId;
  return `logStats:${req.user?.id}:${metricId || "all"}`;
};

router.use(authMiddleware);

// * =========== Query Endpoints ===========

// GET All Logs (with optional metricId filter)
router.get(
  "/",
  validate(listMetricLogsViaCursorSchema),
  cacheMiddleware(logsCursorCacheKey, 300),
  getUserLogLibrariesViaCursor
);

// GET Aggregated Stats for logs (with optional metricId filter)
router.get(
  "/stats",
  validate(getAggregatedStatsSchema),
  cacheMiddleware(logStatsCacheKey, 300),
  getAggregatedStats
);

// GET Log by Id
router.get(
  "/:id",
  validate(getMetricLogByIdSchema),
  cacheMiddleware(logCacheKey, 300), // Cache a single log entry
  getLogById
);

// * =========== Commands Endpoints ===========

// CREATE Log
router.post(
  "/",
  userRateLimiter,
  validate(createMetricLogSchema),
  createMetricLog
);

// UPDATE Log
router.put("/:id", userRateLimiter, validate(updateMetricLogSchema), updateLog);

// DELETE Log
router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricLogSchema),
  deleteLog
);

// ===== Endpoints for Testing Purposes =====

// Generate Dummy Logs for a specific metric (new endpoint)
router.post(
  "/:metricId/dummy",
  userRateLimiter,
  validate(generateDummyMetricLogsSchema),
  generateDummyMetricLogs
);

export default router;
