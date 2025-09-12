import { Response, NextFunction } from "express";
import { MetricCategoryDomain } from "@/features/metric-category/legacies/MetricCategoryLegacy.domain";
import { AuthRequest } from "@/types/request.context";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import { GenerateDummyMetricCategoriesRequestDTO } from "@/features/metric-category/infrastructure/http/dto";
import { listCategoriesQuery } from "@/features/metric-category/infrastructure/http/schema.zod";
import {
  toListResponseDTOLegacy,
  toResponseDTOLegacy,
} from "./MetricCategoryLegacy.mapper";
import {
  createMetricCategoryServiceLegacy,
  deleteMetricCategoryServiceLegacy,
  generateDummyCategoriesServiceLegacy,
  getUserMetricCategoryByIdServiceLegacy,
  listMetricCategoriesLegacy,
  updateMetricCategoryServiceLegacy,
} from "./MetricCategoryLegacy.service";
import { assertAuthenticated } from "@/utils/auth-guards";

/**
 * * Create a new Metric Category
 * @route POST /api/categories
 */
export const createCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const category: MetricCategoryDomain =
      await createMetricCategoryServiceLegacy(req.user.id, req.body);

    const dto = toResponseDTOLegacy(category);

    successResponse(res, 201, dto, "Category created successfully");
  }
);

/**
 * * Get All Categories owned by User
 * @route GET /api/categories
 */
export const getAllCategoriesLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const parsed = listCategoriesQuery.parse(req.query);
    const { limit, sort, q, after, includeTotal } = parsed;
    const filter =
      parsed["filter[name]"] && parsed["filter[name]"]!.trim().length > 0
        ? { name: parsed["filter[name]"]!.trim() }
        : undefined;

    const page = await listMetricCategoriesLegacy({
      userId: req.user.id,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    // Explicit response DTO to guarantee presence/absence of keys as intended
    const dto = {
      items: page.items.map(toResponseDTOLegacy),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    // Question: Should have an explicit return DTO type/mapper like other function
    successResponse(res, 200, dto, "Categories list retrieved successfully");
  }
);

/**
 * * Get specific Category by Id
 * @route GET /api/categories/:id
 */
export const getCategoryByIdLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const category: MetricCategoryDomain =
      await getUserMetricCategoryByIdServiceLegacy(req.user.id, req.params.id);

    const dto = toResponseDTOLegacy(category);

    successResponse(res, 200, dto, "Category retrieved successfully");
  }
);

/**
 * * Update Category
 * @route PUT /api/categories/:id
 */
export const updateCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const category: MetricCategoryDomain =
      await updateMetricCategoryServiceLegacy(
        req.user.id,
        req.params.id,
        req.body
      );

    const dto = toResponseDTOLegacy(category);

    successResponse(res, 200, dto, "Category updated successfully");
  }
);

/**
 * * Delete Category
 * @route DELETE /api/categories/:id
 */
export const deleteCategoryLegacy = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const category: MetricCategoryDomain =
      await deleteMetricCategoryServiceLegacy(req.user.id, req.params.id);

    const dto = toResponseDTOLegacy(category);

    successResponse(res, 200, dto, "Category deleted successfully");
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
    assertAuthenticated(req);

    const { count } = req.body as GenerateDummyMetricCategoriesRequestDTO;

    const dummyCategories = await generateDummyCategoriesServiceLegacy(
      req.user.id,
      count
    );

    const dto = toListResponseDTOLegacy(dummyCategories);

    successResponse(
      res,
      201,
      dto,
      `${count} dummy metric categories generated successfully`
    );
  }
);
