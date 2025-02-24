//src/controllers/metric-category-controller.ts

import db from "../models/index.js";
import { env } from "../config/zodEnv.js";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redis-client.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import { successResponse } from "../utils/response-formatter.js";
import logger from "../utils/logger.js";

const { MetricCategory } = db;

/**
 * * Metric Category Controller
 * Handles CRUD operations for metric categories.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Create a new Metric Category
 * @route POST /api/categories
 */
export const createCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { name, color = "#E897A3", icon = "📁" } = req.body;

    // Check for duplicate category name for the same user:
    const existingCategory = await MetricCategory.findOne({
      where: { userId, name },
    });
    if (existingCategory) {
      throw new AppError("Category already exists", 400);
    }

    const category = await MetricCategory.create({
      userId,
      name,
      color,
      icon,
    });

    // Invalidate only the categories list cache (not individual category cache)
    if (redisClient.isOpen) {
      await redisClient.del(`categories:${userId}`);
      logger.info(`♻️ Cache invalidated for categories:${userId}`);
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

    successResponse(res, 201, { category }, "Category created successfully");
  }
);

/**
 * * Get All Categories owned by User
 * @route GET /api/categories
 */
export const getAllCategories = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const categories = await MetricCategory.findAll({ where: { userId } });

    successResponse(res, 200, { categories });
  }
);

/**
 * * Get specific Category by Id
 * @route GET /api/categories/:id
 */
export const getCategoryById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    if (!id) throw new AppError("Category ID is required", 400);

    const category = await MetricCategory.findOne({ where: { id, userId } });
    if (!category) throw new AppError("Category not found", 404);

    successResponse(res, 200, { category });
  }
);

/**
 * * Update Category
 * @route PUT /api/categories/:id
 */
export const updateCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;
    const { name, icon, color } = req.body;

    if (!id) throw new AppError("Category ID is required", 400);

    const category = await MetricCategory.findOne({ where: { id, userId } });
    if (!category) throw new AppError("Category not found", 404);

    await category.update({ name, color, icon });

    // Invalidate Redis cache
    if (redisClient.isOpen) {
      await redisClient.del(`category:${userId}:${id}`); // Invalidate the single category cache
      await redisClient.del(`categories:${userId}`); // Invalidate the categories list cache
      logger.info(
        `♻️ Cache invalidated for category:${userId}:${id} and categories:${userId}`
      );
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

    successResponse(res, 200, { category }, "Category updated successfully");
  }
);

/**
 * * Delete Category
 * @route DELETE /api/categories/:id
 */
export const deleteCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    if (!id) throw new AppError("Category ID is required", 400);

    const category = await MetricCategory.findOne({ where: { id, userId } });
    if (!category) throw new AppError("Category not found", 404);

    await category.destroy();

    // Invalidate Redis cache
    if (redisClient.isOpen) {
      await redisClient.del(`category:${userId}:${id}`); // Invalidate the single category cache
      await redisClient.del(`categories:${userId}`); // Invalidate the categories list cache
      logger.info(
        `♻️ Cache invalidated for category:${userId}:${id} and categories:${userId}`
      );
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

    successResponse(res, 200, { category }, "Category deleted successfully");
  }
);
