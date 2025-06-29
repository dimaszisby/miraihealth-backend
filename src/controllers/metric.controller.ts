// src/controllers/metric.controller.ts

import { Request, Response, NextFunction } from "express";

// Internal Types
import { AuthRequest } from "@/types/request.context";

// Services
import * as MetricService from "@/services/metric.service";

// Utils
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import catchAsync from "@/utils/catch-async";
import {
  toMetricLibraryResponseDTO,
  toMetricResponseDTO,
  toUserMetricDetailResponseDTO,
} from "@/utils/mappers/metric.mapper";
import {
  MetricDomain,
  MetricLibraryDomain,
} from "@/types/domain/metric.domain";
import { GenerateDummyMetricsRequestDTO } from "@/types/dtos/metric.dto";

/**
 * * Metric Controller
 * Handles CRUD operations for user metrics.
 */

/**
 * * Create a new Metric
 * @route POST /api/metrics
 */
export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = req.body;

    const metricDomain: MetricDomain = await MetricService.createMetricService(
      userId,
      {
        categoryId,
        originalMetricId,
        name,
        description,
        defaultUnit,
        isPublic,
      }
    );
    successResponse(
      res,
      201,
      { metric: toMetricResponseDTO(metricDomain) },
      "Metric created successfully."
    );
  }
);

/**
 * * Get All Metrics owned by User
 * @route GET /api/metrics
 */
export const getUserMetricLibraries = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    // Sanitize and validate pagination params
    let { page = 1, limit = 20 } = req.query;
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 20; // cap limit to prevent abuse

    // Forward all params, including sanitized pagination
    const { metricsDomain, total } =
      await MetricService.getUserMetricLibrariesService(userId, {
        ...req.query,
        page,
        limit,
      });

    const metricsResponseDTO = metricsDomain.map((metric) =>
      toMetricLibraryResponseDTO(metric)
    );

    successResponse(res, 200, { metrics: metricsResponseDTO, total: total });
  }
);

// Development Note: This funciton is not currently used in the application.
// Development Note: This function is WAS deprecated due to API endpoint changes (from nested to flat structure), but will be reimplemented for metric details retrieval.
// TODO: Activate a new endpoint for this pipeline that functioned to get user's owned metrics details with it's related domain types (objects): metric-settings, metric-logs, etc.
/**
 * @deprecated This function is deprecated due to API endpoint changes (from nested to flat structure).
 * * Get specific User Metric by Id
 * @route GET /api/metrics/:id
 */
export const getUserDetailMetricById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const metric = await MetricService.getUserMetricDetailService(userId, id);
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }
    successResponse(
      res,
      200,
      toUserMetricDetailResponseDTO(metric),
      "Metric retrieved successfully"
    );
  }
);

/**
 * * Get specific Metric by Id
 * @route GET /api/metrics/:id
 */
export const getMetricById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const metric = await MetricService.getUserMetricByIdService(userId, id);
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }
    successResponse(
      res,
      200,
      toMetricResponseDTO(metric),
      "Metric retrieved successfully"
    );
  }
);

/**
 * * Update Metric
 * @route PUT /api/metrics/:id
 */
export const updateMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const updatedMetricDomain: MetricDomain =
      await MetricService.updateMetricService(id, userId, req.body);
    successResponse(
      res,
      200,
      { metric: toMetricResponseDTO(updatedMetricDomain) },
      "Metric updated successfully"
    );
  }
);

/**
 * * Delete Metric
 * @route DELETE /api/metrics/:id
 */
export const deleteMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const metricDomain: MetricDomain = await MetricService.deleteMetricService(
      userId,
      id
    );
    successResponse(
      res,
      200,
      { metric: toMetricResponseDTO(metricDomain) },
      "Metric deleted successfully"
    );
  }
);

/**
 * * ===== Controllers for Testing Purposes =====
 */

/**
 * * Generate Dummy Metrics
 * @route POST /api/metrics/dummy
 */
export const generateDummyMetrics = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { count } = req.body as GenerateDummyMetricsRequestDTO;

    const dummyMetrics = await MetricService.generateDummyMetricsService(
      userId,
      count
    );

    successResponse(
      res,
      201,
      { metrics: dummyMetrics.map(toMetricResponseDTO) },
      `${count} dummy metrics generated successfully`
    );
  }
);
