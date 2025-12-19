import { Router } from "express";
import { env } from "@/config/envManager";
import {
  createCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
  generateDummyCategories,
} from "./controller";
import { authMiddleware } from "@/features/auth/infrastructure/http/authMiddleware";
import { cacheMiddleware } from "@/shared/middleware/cache";
import { userRateLimiter } from "@/shared/middleware/rate-limiter";
import { validate } from "@/shared/middleware/validation";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  getAllMetricCategoriesSchema,
  deleteMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod";
import { AuthRequest } from "@/types/request.context";
import { buildCursorCacheKey } from "@/shared/cache/keys";
import {
  METRIC_CATEGORY_CURSOR_FEATURE,
  METRIC_CATEGORY_CURSOR_VERSION,
} from "@/features/metric-category/application/cache.constants";

const categoriesCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any;
  const fname = (req.query["filter[name]"] as string) ?? "";
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
