import { Router } from "express";
import { env } from "@/config/envManager.js";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  generateDummyCategories,
} from "./controller.js";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware.js";
import { cacheMiddleware } from "@/shared/middleware/cache.js";
import { userRateLimiter } from "@/shared/middleware/rate-limiter.js";
import { validate } from "@/shared/middleware/validation.js";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  getAllMetricCategoriesSchema,
  deleteMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod.js";
import { AuthRequest } from "@/types/request.context.js";
import { buildCursorCacheKey } from "@/shared/cache/keys.js";
import {
  METRIC_CATEGORY_CURSOR_FEATURE,
  METRIC_CATEGORY_CURSOR_VERSION,
} from "@/features/metric-category/application/cache.constants.js";

const categoriesCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any;
  const fname = (req.query["filter[name]"] as string) ?? ".js";
  const includeTotal = String(req.query.includeTotal ?? "false");
  return buildCursorCacheKey({
    feature: METRIC_CATEGORY_CURSOR_FEATURE,
    version: METRIC_CATEGORY_CURSOR_VERSION,
    userId: req.user?.id,
    segments: [
      ["l", limit],
      ["s", sort],
      ["q", q ?? ""],
      ["fn", fname],
      ["after", after ?? ""],
      ["it", includeTotal],
    ],
  });
};

const categoryCacheKey = (req: AuthRequest) =>
  `category:${req.user?.id}:${req.params.id}`;

export const createMetricCategoryRouter = () => {
  const router = Router();
  router.use(authMiddleware);

  router.post(
    "/",
    userRateLimiter,
    validate(createMetricCategorySchema),
    createCategory
  );

  router.get(
    "/",
    validate(getAllMetricCategoriesSchema),
    cacheMiddleware(categoriesCacheKey, 300),
    listCategories
  );

  router.get(
    "/:id",
    validate(getMetricCategorySchema),
    cacheMiddleware(categoryCacheKey, 600),
    getCategory
  );

  router.put(
    "/:id",
    userRateLimiter,
    validate(updateMetricCategorySchema),
    updateCategory
  );

  router.delete(
    "/:id",
    userRateLimiter,
    validate(deleteMetricCategorySchema),
    deleteCategory
  );

  if (env.ENABLE_DUMMY_ENDPOINTS) {
    router.post(
      "/dummy",
      userRateLimiter,
      validate(generateDummyMetricCategoriesSchema),
      generateDummyCategories
    );
  }

  return router;
};

export const metricCategoryRouter = createMetricCategoryRouter();
