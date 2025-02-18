//src/controllers/metric-log-controller.ts
import { Request, Response, NextFunction } from "express";
import { MetricLog } from "../models/metric-log.js";
import { Metric } from "../models/metric.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";
import * as metricLogService from "../services/metric-log-service.js";

/**
 * * Metric Log Controller
 * Handles CRUD operations for metric logs.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Create a Log for a Metric
 * @route POST /api/metrics/:metricId/logs
 */
export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;
    const { type, logValue, loggedAt } = req.body;

    const log = await metricLogService.createLog(metricId, {
      type,
      logValue,
      loggedAt,
    });

    successResponse(res, 201, { log }, "Metric Log created successfully");
  }
);

/**
 * * Get All Logs for a Metric
 * @route GET /api/metrics/:metricId/logs
 */
export const getAllLogsByMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;
    const { startDate, endDate, sortBy, order } = req.query;

    // 1) Check that the metric exists
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    // 2) Enforce ownership or “isPublic”
    if (!metric.isPublic && metric.userId !== req.user!.id) {
      throw new AppError("Unauthorized access to logs", 403);
    }

    // 3) Proceed with fetching logs
    const logs = await metricLogService.getAllLogsByMetricService(metricId, {
      startDate: startDate ? new Date(startDate as string) : undefined,
      endDate: endDate ? new Date(endDate as string) : undefined,
      sortBy: (sortBy as string) || "loggedAt",
      order: (order as "asc" | "desc") || "desc",
    });

    successResponse(res, 200, { logs });
  }
);

/**
 * * Get Specific Log by ID
 * @route GET /api/metrics/:metricId/logs/:id
 */
export const getLogById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, metricId } = req.params;

    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user?.id;

    const log = await metricLogService.getLogByIdService(userId, metricId, id);

    successResponse(res, 200, { log });
  }
);

/**
 * * Update a Log
 * @route PUT /api/metrics/:metricId/logs/:id
 */
export const updateLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, metricId } = req.params;
    const { logValue, type, loggedAt } = req.body;

    const log = await metricLogService.updateLogService(metricId, id, {
      logValue,
      type,
      loggedAt,
    });

    successResponse(res, 200, { log }, "Log updated successfully");
  }
);

/**
 * * Delete a Log
 * @route DELETE /api/metrics/:metricId/logs/:id
 */
export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, metricId } = req.params;

    const log = await metricLogService.deleteLogService(metricId, id);
    successResponse(res, 200, { log }, "Log deleted successfully");
  }
);

/**
 * * Get Aggregated Stats for Metric Logs
 * @route GET /api/metrics/:metricId/logs/stats
 */
export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    // Extract metricId from request params
    const { metricId } = req.params;
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    // Ensure metric exists and belongs to user (or is public)
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) throw new AppError("Metric not found", 404);
    if (!metric.isPublic && metric.userId !== userId)
      throw new AppError("Unauthorized access to metric stats", 403);

    const stats = await metricLogService.getAggregatedStats(userId, metricId);
    successResponse(res, 200, stats);
  }
);
