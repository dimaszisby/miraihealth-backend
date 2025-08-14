// src/features/metric-category/infrastructure/http/controller.ts

import { Response, NextFunction } from "express";
import { MetricCategoryDomain } from "@/features/metric-category/domain/entities/domain";
import { AuthRequest } from "@/types/request.context";
import AppError from "@/utils/AppError";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import {
  toMetricCategoryResponseDTO,
  toMetricCategoryListResponseDTO,
} from "@/features/metric-category/infrastructure/mapping/mapper";
import { GenerateDummyMetricCategoriesRequestDTO } from "@/features/metric-category/infrastructure/http/dto";
import logger from "@/utils/logger";
import { listCategoriesQuery } from "@/features/metric-category/infrastructure/http/schema.zod";
import listMetricCategories, {
  SortParam,
} from "../../application/queries/ListCategories";
import createMetricCategoryService from "../../application/commands/CreateCategory";
import getUserMetricCategoryByIdService from "../../application/queries/GetCategoryById";
import updateMetricCategoryService from "../../application/commands/UpdateCategory";
import deleteMetricCategoryService from "../../application/commands/DeleteCategory";
import generateDummyCategoriesService from "../../application/commands/CreateDummyCategories";

/**
 * * Metric Category Controller
 * Handles CRUD operations for metric categories.
 */

const isSortParam = (v: unknown): v is SortParam =>
  typeof v === "string" &&
  [
    "createdAt",
    "-createdAt",
    "updatedAt",
    "-updatedAt",
    "name",
    "-name",
    "metricCount",
    "-metricCount",
  ].includes(v);

/**
 * * Create a new Metric Category
 * @route POST /api/categories
 */
export const createCategory = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain = await createMetricCategoryService(
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

    const userId = req.user.id;

    const parsed = listCategoriesQuery.parse(req.query);
    const { limit, sort, q, after, includeTotal } = parsed;
    const filter =
      parsed["filter[name]"] && parsed["filter[name]"]!.trim().length > 0
        ? { name: parsed["filter[name]"]!.trim() }
        : undefined;

    const page = await listMetricCategories({
      userId,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    // Explicit response DTO to guarantee presence/absence of keys as intended
    const dto = {
      items: page.items.map(toMetricCategoryResponseDTO),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    // Question: Should have an explicit return DTO type/mapper like other function
    successResponse(res, 200, dto);
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
      await getUserMetricCategoryByIdService(req.user.id, req.params.id);
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

    const category: MetricCategoryDomain = await updateMetricCategoryService(
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

    const category: MetricCategoryDomain = await deleteMetricCategoryService(
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

    const dummyCategories = await generateDummyCategoriesService(userId, count);

    successResponse(
      res,
      201,
      { categories: toMetricCategoryListResponseDTO(dummyCategories) },
      `${count} dummy metric categories generated successfully`
    );
  }
);
