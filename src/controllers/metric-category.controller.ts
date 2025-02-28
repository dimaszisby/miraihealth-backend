// src/controllers/metric-category.controller.ts

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/request.context.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import { successResponse } from "../utils/response-formatter.js";
import * as MetricCategoryService from "../services/metric-category.service.js";

/**
 * * Metric Category Controller
 * Handles CRUD operations for metric categories.
 */

/**
 * * Create a new Metric Category
 * @route POST /api/categories
 */
export const createCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category = await MetricCategoryService.createMetricCategoryService(
      req.user.id,
      req.body
    );
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

    const categories =
      await MetricCategoryService.getAllUserMetricCategoryService(req.user.id);
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

    const category =
      await MetricCategoryService.getUserMetricCategoryByIdService(
        req.user.id,
        req.params.id
      );
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

    const category = await MetricCategoryService.updateMetricCategoryService({
      userId: req.user.id,
      categoryId: req.params.id,
      updateData: req.body,
    });
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

    const category = await MetricCategoryService.deleteMetricCategoryService(
      req.user.id,
      req.params.id
    );
    successResponse(res, 200, { category }, "Category deleted successfully");
  }
);
