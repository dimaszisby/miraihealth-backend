// src/features/metric-category/infrastructure/http/controller.ts

import { Response, NextFunction } from "express";
import { MetricCategoryDomain } from "@/features/metric-category/legacies/MetricCategoryLegacy.domain";
import { AuthRequest } from "@/types/request.context";
import AppError from "@/utils/AppError";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import { GenerateDummyMetricCategoriesRequestDTO } from "@/features/metric-category/infrastructure/http/dto";
import { listCategoriesQuery } from "@/features/metric-category/infrastructure/http/schema.zod";
import {
  toListResponseDTOLegacy,
  toMResponseDTOLegacy,
} from "./MetricCategoryLegacy.mapper";
import { SortParam } from "../domain/types";
import {
  createMetricCategoryServiceLegacy,
  deleteMetricCategoryServiceLegacy,
  generateDummyCategoriesServiceLegacy,
  getUserMetricCategoryByIdServiceLegacy,
  listMetricCategoriesLegacy,
  updateMetricCategoryServiceLegacy,
} from "./MetricCategoryLegacy.service";

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
export const createCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await createMetricCategoryServiceLegacy(req.user.id, req.body);
    successResponse(
      res,
      201,
      { category: toMResponseDTOLegacy(category) },
      "Category created successfully"
    );
  }
);

/**
 * * Get All Categories owned by User
 * @route GET /api/categories
 */
export const getAllCategoriesLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const userId = req.user.id;

    const parsed = listCategoriesQuery.parse(req.query);
    const { limit, sort, q, after, includeTotal } = parsed;
    const filter =
      parsed["filter[name]"] && parsed["filter[name]"]!.trim().length > 0
        ? { name: parsed["filter[name]"]!.trim() }
        : undefined;

    const page = await listMetricCategoriesLegacy({
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
      items: page.items.map(toMResponseDTOLegacy),
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
export const getCategoryByIdLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await getUserMetricCategoryByIdServiceLegacy(req.user.id, req.params.id);
    successResponse(res, 200, {
      category: toMResponseDTOLegacy(category),
    });
  }
);

/**
 * * Update Category
 * @route PUT /api/categories/:id
 */
export const updateCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await updateMetricCategoryServiceLegacy(
        req.user.id,
        req.params.id,
        req.body
      );
    successResponse(
      res,
      200,
      { category: toMResponseDTOLegacy(category) },
      "Category updated successfully"
    );
  }
);

/**
 * * Delete Category
 * @route DELETE /api/categories/:id
 */
export const deleteCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const category: MetricCategoryDomain =
      await deleteMetricCategoryServiceLegacy(req.user.id, req.params.id);
    successResponse(
      res,
      200,
      { category: toMResponseDTOLegacy(category) },
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
export const generateDummyCategoriesLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const userId = req.user.id;
    const { count } = req.body as GenerateDummyMetricCategoriesRequestDTO;

    const dummyCategories = await generateDummyCategoriesServiceLegacy(
      userId,
      count
    );

    successResponse(
      res,
      201,
      { categories: toListResponseDTOLegacy(dummyCategories) },
      `${count} dummy metric categories generated successfully`
    );
  }
);
