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
  toMetricResponseDTO,
  toUserMetricDetailResponseDTO,
} from "@/utils/mappers/metric.mapper";

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

    const metric = await MetricService.createMetricService(userId, {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    });
    successResponse(
      res,
      201,
      { metric: toMetricResponseDTO(metric) },
      "Metric created successfully."
    );
  }
);

/**
 * * Get All Metrics owned by User
 * @route GET /api/metrics
 */
export const getAllMetrics = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const metrics = await MetricService.getMetricsListService(userId);
    successResponse(res, 200, { metrics });
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

// * NEW Controller func
// Currently not being used
// Prepared for future development
/**
 * * Get specific Public Metric by Id
 * @route GET /api/metrics/:id
 */
export const getPublicMetricById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const { id } = req.params;

    const metric = await MetricService.getPublicMetricByIdService(id);
    successResponse(res, 200, { metric: toMetricResponseDTO(metric) });
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

    const updatedMetric = await MetricService.updateMetricService(
      id,
      userId,
      req.body
    );
    successResponse(
      res,
      200,
      { metric: toMetricResponseDTO(updatedMetric) },
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

    const metric = await MetricService.deleteMetricService(userId, id);
    successResponse(
      res,
      200,
      { metric: toMetricResponseDTO(metric) },
      "Metric deleted successfully"
    );
  }
);
