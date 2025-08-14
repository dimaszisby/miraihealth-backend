// src/features/metric-category/infrastructure/http/routes.ts

import { Router } from "express";

// Controllers
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
  generateDummyCategories,
} from "@/features/metric-category/infrastructure/http/controller.js";

// Middlewares
import { authMiddleware } from "@/middleware/auth-middleware.js";
import { cacheMiddleware } from "@/middleware/cache-middleware.js";
import { userRateLimiter } from "@/middleware/rate-limiter.js";
import { validate } from "@/middleware/validate.js";

// Schema validation
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  getAllMetricCategoriesSchema,
  deleteMetricCategorySchema,
  generateDummyMetricCategoriesSchema,
} from "@/features/metric-category/infrastructure/http/schema.zod.js";
import { AuthRequest } from "@/types/request.context";

const router = Router();

// * Apply Authentication Middleware for all category routes
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID and category ID
 */

const categoriesCacheKey = (req: AuthRequest) => {
  const { limit = 20, sort = "-createdAt", q, after } = req.query as any; // only cache GET list
  const fname = (req.query["filter[name]"] as string) ?? ""; // allowlist filter keys to avoid cache explosion
  const includeTotal = String(req.query.includeTotal ?? "false");
  return `categories:${req.user?.id}:l:${limit}:s:${sort}:q:${q ?? ""}:fn:${fname}:after:${after ?? ""}:it:${includeTotal}`;
};

const categoryCacheKey = (req: AuthRequest) =>
  `category:${req.user?.id}:${req.params.id}`;

/**
 * * Category Endpoints
 *
 * Use userRateLimiter for writes (POST, PUT, DELETE)
 * - to limit how many logs a single user can create or update within the given time window (default 15 min).
 */

// CREATE Category
router.post(
  "/",
  userRateLimiter,
  validate(createMetricCategorySchema),
  createCategory
);

// GET All Categories by User Id
// Developer Note: Currently using cursor as an active method
router.get(
  "/",
  validate(getAllMetricCategoriesSchema),
  cacheMiddleware(categoriesCacheKey, 300),
  getAllCategories
);

// GET specific Category by Id
router.get(
  "/:id",
  validate(getMetricCategorySchema),
  cacheMiddleware(categoryCacheKey, 600),
  getCategoryById
);

// UPDATE Category
router.put(
  "/:id",
  userRateLimiter,
  validate(updateMetricCategorySchema),
  updateCategory
);

// DELETE Category
router.delete(
  "/:id",
  userRateLimiter,
  validate(deleteMetricCategorySchema),
  deleteCategory
);

/**
 * * ===== Endpoints for Testing Purposes =====
 */

// Generate Dummy Categories
router.post(
  "/dummy",
  userRateLimiter,
  validate(generateDummyMetricCategoriesSchema),
  generateDummyCategories
);

export default router;
