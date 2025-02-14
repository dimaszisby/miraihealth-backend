import { Request, Response, NextFunction } from "express";
import { Metric } from "../models/metric.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";
import {
  getMetricData,
  getMetricDetailData,
} from "../services/metric-service.js";

/**
 * * Metric Controller
 * Handles CRUD operations for user metrics.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Create a new Metric
 * @route POST /api/metrics
 */
export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = req.body;

    // Ensure userId is always a string
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const metric = await Metric.create({
      userId,
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    });

    successResponse(res, 201, { metric }, "Metric created successfully.");
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

    const metrics = await getMetricData(userId);
    successResponse(res, 200, { metrics });
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

    const metric = await getMetricDetailData(userId, id);
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    successResponse(res, 200, { metric });
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
    const { categoryId, originalMetricId, name, defaultUnit, isPublic } =
      req.body;

    if (!id) throw new AppError("Metric ID is required", 400);

    const metric = await Metric.findOne({ where: { id, userId } });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    await metric.update({
      categoryId,
      originalMetricId,
      name,
      defaultUnit,
      isPublic,
    });

    successResponse(res, 200, { metric }, "Metric updated successfully");
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
    if (!id) throw new AppError("Metric ID is required", 400);

    const metric = await Metric.findOne({ where: { id, userId } });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    await metric.destroy();

    successResponse(res, 200, { metric }, "Metric deleted successfully");
  }
);
