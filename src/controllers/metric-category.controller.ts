// src/controllers/metric-category.controller.ts

import { Request, Response, NextFunction } from "express";
import * as MetricCategoryService from "@/services/metric-category.service";
import { MetricCategoryDomain } from "@/types/domain/metric-category.domain";
import { AuthRequest } from "@/types/request.context";
import AppError from "@/utils/AppError";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import {
  toMetricCategoryResponseDTO,
  toMetricCategoryListResponseDTO,
} from "@/utils/mappers/metric-category.mapper";
import { GenerateDummyMetricCategoriesRequestDTO } from "@/types/dtos/metric-category.dto";

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

    const category: MetricCategoryDomain =
      await MetricCategoryService.createMetricCategoryService(
        req.user.id,
        req.body
      );
    successResponse(
      res,
      201,
      { category: toMetricCategoryResponseDTO(category) },
      "Category created successfully"
    );
  }
);

/**
 * * Get All Categories owned by User
 * @route GET /api/categories
 */
export const getAllCategories = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const categories: MetricCategoryDomain[] =
      await MetricCategoryService.getAllUserMetricCategoryService(req.user.id);

    const categoriesRespose = categories.map(toMetricCategoryResponseDTO);

    successResponse(res, 200, { categories: categoriesRespose });
  }
);

/**
 * * Get specific Category by Id
 * @route GET /api/categories/:id
 */
export const getCategoryById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await MetricCategoryService.getUserMetricCategoryByIdService(
        req.user.id,
        req.params.id
      );
    successResponse(res, 200, {
      category: toMetricCategoryResponseDTO(category),
    });
  }
);

/**
 * * Update Category
 * @route PUT /api/categories/:id
 */
export const updateCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await MetricCategoryService.updateMetricCategoryService(
        req.user.id,
        req.params.id,
        req.body
      );
    successResponse(
      res,
      200,
      { category: toMetricCategoryResponseDTO(category) },
      "Category updated successfully"
    );
  }
);

/**
 * * Delete Category
 * @route DELETE /api/categories/:id
 */
export const deleteCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await MetricCategoryService.deleteMetricCategoryService(
        req.user.id,
        req.params.id
      );
    successResponse(
      res,
      200,
      { category: toMetricCategoryResponseDTO(category) },
      "Category deleted successfully"
    );
  }
);

/**
 * * ===== Controllers for Testing Purposes =====
 */

/**
 * * Generate Dummy Metric Categories
 * @route POST /api/categories/dummy
 */
export const generateDummyCategories = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { count } = req.body as GenerateDummyMetricCategoriesRequestDTO;

    const dummyCategories =
      await MetricCategoryService.generateDummyCategoriesService(userId, count);

    successResponse(
      res,
      201,
      { categories: toMetricCategoryListResponseDTO(dummyCategories) },
      `${count} dummy metric categories generated successfully`
    );
  }
);
