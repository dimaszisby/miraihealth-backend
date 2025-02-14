import { Request, Response, NextFunction } from "express";
import { MetricCategory } from "../models/metric-category.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";

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

    const category = await MetricCategory.create({
      userId,
      name,
      color,
      icon,
    });

    successResponse(res, 201, { category }, "Category created successfully.");
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

    successResponse(res, 200, { category }, "Category updated successfully.");
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

    successResponse(res, 200, { category }, "Category deleted successfully.");
  }
);
