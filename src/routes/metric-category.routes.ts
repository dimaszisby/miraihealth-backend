// src/metric-category.routes.ts

import { Router } from "express";
import {
  createCategory,
  getAllCategories,
  getCategoryById,
  updateCategory,
  deleteCategory,
} from "../controllers/metric-category.controller.js";
import { authMiddleware } from "../middleware/auth-middleware.js";
import { cacheMiddleware } from "../middleware/cache-middleware.js";
import { validate } from "../middleware/validate.js";
import {
  createMetricCategorySchema,
  updateMetricCategorySchema,
  getMetricCategorySchema,
  deleteMetricCategorySchema,
} from "../validators/metric-category.validator.js";
import { userRateLimiter } from "../middleware/rate-limiter.js";

const router = Router();

// * Apply Authentication Middleware for all category routes
router.use(authMiddleware);

/**
 * * Key Generator Function
 * Generates a cache key based on user ID and category ID
 */
const categoriesCacheKey = (req: any) => `categories:${req.user?.id}`;
const categoryCacheKey = (req: any) =>
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
router.get("/", cacheMiddleware(categoriesCacheKey, 300), getAllCategories);

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

export default router;
