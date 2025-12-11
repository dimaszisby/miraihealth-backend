import { Router } from "express";
import { z } from "zod";
import {
  createMetric,
  getUserMetricLibrariesViaCursor,
  getUserDetailMetricById,
  updateMetric,
  deleteMetric,
  generateDummyMetrics,
} from "./controller";
import { handleMetricTrend } from "@/features/analytics/infrastructure/http/controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { cacheMiddleware } from "@/shared/middleware/cache";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createMetricSchema,
  updateMetricSchema,
  deleteMetricSchema,
  getMetricSchema,
  generateDummyMetricsSchema,
  getAllMetricsViaCursorSchema,
} from "@/types/api/zod-metric.schema";
import { AuthRequest } from "@/types/request.context";
import { env } from "@/config/zodEnv";

const metricsCacheKey = (req: AuthRequest) => {
  const q = req.query as Record<string, unknown>;
  const allow = [
    "page",
    "limit",
    "sortBy",
    "sortOrder",
    "q",
    "name",
    "categoryId",
    "isPublic",
  ] as const;

  const picked: Record<string, unknown> = {};
  for (const k of allow) {
    if (q[k] !== undefined && q[k] !== null && q[k] !== "") picked[k] = q[k];
  }

  if (picked.page === undefined) picked.page = 1;
  if (picked.limit === undefined) picked.limit = 20;
  if (picked.sortBy === undefined) picked.sortBy = "createdAt";
  if (picked.sortOrder === undefined) picked.sortOrder = "DESC";

  const stable = Object.keys(picked)
    .sort()
    .map((k) => `${k}:${String(picked[k])}`)
    .join("|");

  return `metrics:${req.user?.id}:${stable}`;
};

const metricsCursorCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any;
  const fname = (req.query["filter[name]"] as string) ?? "";
  const fcat = (req.query["filter[categoryId]"] as string) ?? "";
  const includeTotal = String(req.query.includeTotal ?? "false");

  return [
    "metrics",
    req.user?.id,
    `l:${limit}`,
    `s:${sort}`,
    `q:${q ?? ""}`,
    `fn:${fname}`,
    `fc:${fcat}`,
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
    includeNormalized = "category,logs,settings";
  } else if (includeRaw !== "flat") {
    includeNormalized = includeRaw
      .split(",")
      .map((s) => s.trim())
      .filter((s): s is (typeof allowed)[number] => allowed.includes(s as any))
      .sort()
      .join(",");
    if (!includeNormalized) includeNormalized = "flat";
  }

  return `metric:${req.user?.id}:${req.params.id}:inc:${includeNormalized}:ll:${logsLimit}`;
};

export const createMetricRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.post("/", userRateLimiter, validate(createMetricSchema), createMetric);

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

  const trendParams = { params: z.object({ metricId: z.string().uuid() }) };
  router.get("/:metricId/trends", validate(trendParams as any), handleMetricTrend);

  if (env.ENABLE_DUMMY_ENDPOINTS) {
    router.post(
      "/dummy",
      userRateLimiter,
      validate(generateDummyMetricsSchema),
      generateDummyMetrics
    );
  }

  return router;
};

export const metricRouter = createMetricRouter();
