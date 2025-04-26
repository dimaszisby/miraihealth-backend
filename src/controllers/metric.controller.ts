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

    const metricsDomain: MetricLibraryDomain[] =
      await MetricService.getUserMetricLibrariesService(userId, req.query);
    const metricsResponseDTO = metricsDomain.map((metric) =>
      toMetricLibraryResponseDTO(metric)
    );

    successResponse(res, 200, { metrics: metricsResponseDTO });
  }
);

/**
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
    successResponse(res, 200, {
      metric: toUserMetricDetailResponseDTO(metric),
    });
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
