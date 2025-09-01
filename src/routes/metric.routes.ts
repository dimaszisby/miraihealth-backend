import { Router } from "express";
import { z } from "zod";
import {
  createMetric,
  getUserMetricLibrariesViaCursor,
  getUserDetailMetricById,
  updateMetric,
  deleteMetric,
  generateDummyMetrics,
} from "@/controllers/metric.controller";
import { getTrends } from "@/controllers/trend.controller";
import { authMiddleware } from "@/middleware/auth-middleware";
import { cacheMiddleware } from "@/middleware/cache-middleware";
import { userRateLimiter } from "@/middleware/rate-limiter";
import { validate } from "@/middleware/validate";
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
  generateDummyMetricsSchema,
  getAllMetricsViaCursorSchema,
} from "@/types/api/zod-metric.schema";
import { AuthRequest } from "@/types/request.context";

const router = Router();
router.use(authMiddleware);

// LIST: offset (deprecated, migrating to cursor)
const metricsCacheKey = (req: AuthRequest) => {
  const q = req.query as Record<string, unknown>;

  // whitelist params that affect the list result
  const allow = [
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    // add all filters you support here:
    "q",
    "name",
    "categoryId",
    "isPublic",
  ] as const;

  // normalize + stable stringify
  const picked: Record<string, unknown> = {};
  for (const k of allow) {
    if (q[k] !== undefined && q[k] !== null && q[k] !== "") picked[k] = q[k];
  }

  // defaults to keep consistency
  if (picked.page === undefined) picked.page = 1;
  if (picked.limit === undefined) picked.limit = 20;
  if (picked.sortBy === undefined) picked.sortBy = "createdAt";
  if (picked.sortOrder === undefined) picked.sortOrder = "DESC";

  // stable key: sort keys + JSON
  const stable = Object.keys(picked)
    .sort()
    .map((k) => `${k}:${String(picked[k])}`)
    .join("|");

  return `metrics:${req.user?.id}:${stable}`;
};

// LIST: Cursor
const metricsCursorCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any; // only cache GET list
  const fname = (req.query["filter[name]"] as string) ?? ""; // allowlist filter keys to avoid cache explosion
  const fcat = (req.query["filter[categoryId]"] as string) ?? ""; // WIP
  const includeTotal = String(req.query.includeTotal ?? "false");

  return [
    "metrics",
    req.user?.id,
    `l:${limit}`,
    `s:${sort}`,
    `q:${q ?? ""}`,
    `fn:${fname}`,
    `fc:${fcat}`, // WIP
    `after:${after ?? ""}`,
    `it:${includeTotal}`,
  ].join(":");
};

const metricCacheKey = (req: AuthRequest) => {
  const includeRaw = String((req.query as any)?.include ?? "flat");
  const logsLimit = Number((req.query as any)?.logsLimit ?? 20);

  const allowed = ["settings", "category", "logs"] as const;

  let includeNormalized = "flat";
  if (includeRaw === "full") {
    includeNormalized = "category,logs,settings"; // canonical order
  } else if (includeRaw !== "flat") {
    includeNormalized = includeRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is (typeof allowed)[number] => allowed.includes(s as any))
      .sort() // canonical order
      .join(",");
    if (!includeNormalized) includeNormalized = "flat";
  }

  return `metric:${req.user?.id}:${req.params.id}:inc:${includeNormalized}:ll:${logsLimit}`;
};

/**
 * * Routes
 */
router.post("/", userRateLimiter, validate(createMetricSchema), createMetric);

// DETAIL: Workig Route non-cursor
// router.get(
//   "/",
//   validate(getAllMetricsSchema),
//   cacheMiddleware(metricsCacheKey, 60),
//   getUserMetricLibraries
// );

// DETAIL: Via cursor
router.get(
  "/",
  validate(getAllMetricsViaCursorSchema),
  cacheMiddleware(metricsCursorCacheKey, 60),
  getUserMetricLibrariesViaCursor
);

router.get(
  "/:id",
  validate(getMetricSchema),
  cacheMiddleware(metricCacheKey, 60),
  getUserDetailMetricById
);

router.put("/:id", userRateLimiter, validate(updateMetricSchema), updateMetric);

router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricSchema),
  deleteMetric
);

/** Trends (validate param for safety) */
const trendParams = { params: z.object({ metricId: z.string().uuid() }) }; // small inline guard
router.get("/:metricId/trends", validate(trendParams as any), getTrends);

/** Testing */
router.post(
  "/dummy",
  userRateLimiter,
  validate(generateDummyMetricsSchema),
  generateDummyMetrics
);

export default router;
