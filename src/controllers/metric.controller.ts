// src/controllers/metric.controller.ts

import db from "../models/index.js";
import { env } from "../config/zodEnv.js";
import { Request, Response, NextFunction } from "express";
import { redisClient } from "../utils/redis-client.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";
import {
  createMetricData,
  getMetricData,
  getMetricDetailData,
} from "../services/metric.service.js";
import logger from "../utils/logger.js";

const { Metric, MetricLog, MetricSettings, MetricCategory } = db;

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

    // Delegate metric creation to the service
    const metric = await createMetricData(userId, {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    });

    // Invalidate only the metrics list cache (not individual metric cache)
    if (redisClient.isOpen) {
      await redisClient.del(`metrics:${userId}`);
      logger.info(`♻️ Cache invalidated for metrics:${userId}`);
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

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

    // Update metric
    await metric.update({
      categoryId,
      originalMetricId,
      name,
      defaultUnit,
      isPublic,
    });
    logger.info(`Metric updated successfully in database`);

    // Fetch updated metric
    const updatedMetric = await Metric.findOne({ where: { id, userId } });

    // Invalidate Redis cache
    if (redisClient.isOpen) {
      await redisClient.del(`metric:${userId}:${id}`); // Invalidate the single metric cache
      await redisClient.del(`metrics:${userId}`); // Invalidate the metrics list cache
      logger.info(
        `♻️ Cache invalidated for metric:${userId}:${id} and metrics:${userId}`
      );
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

    successResponse(
      res,
      200,
      { metric: updatedMetric },
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
    // Ensure userId is extracted from the request
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    // Extract metric ID from request
    const { id } = req.params;
    if (!id) throw new AppError("Metric ID is required", 400);

    // Ensure metric exists
    const metric = await Metric.findOne({ where: { id, userId } });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    // Delete metric from database
    await metric.destroy();
    logger.info(`Metric deleted successfully from database`);

    // Invalidate Redis cache
    if (redisClient.isOpen) {
      await redisClient.del(`metric:${userId}:${id}`); // Invalidate the single metric cache
      await redisClient.del(`metrics:${userId}`); // Invalidate the metrics list cache
      logger.info(
        `♻️ Cache invalidated for metric:${userId}:${id} and metrics:${userId}`
      );
    } else {
      logger.warn(
        `Skipping Redis calls in ${env.NODE_ENV} environment because client is closed.`
      );
    }

    successResponse(res, 200, { metric }, "Metric deleted successfully");
  }
);
