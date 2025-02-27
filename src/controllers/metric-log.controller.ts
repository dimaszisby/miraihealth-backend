//src/controllers/metric-log.controller.ts

import { Request, Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";
import { AuthRequest } from "../types/requestContext.js";
import * as metricLogService from "../services/metric-log.service.js";

/**
 * * Metric Log Controller
 * Handles CRUD operations for metric logs.
 */

/**
 * * Create a Log for a Metric
 * @route POST /api/metrics/:metricId/logs
 */
export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    // QUESTION: As you can see this patterns of requests variable declaration is repeating for each function, how to optimized this?
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId } = req.params;
    const { type, logValue, loggedAt } = req.body;

    const log = await metricLogService.createLog({
      userId: userId,
      metricId: metricId,
      logData: {
        type,
        logValue,
        loggedAt,
      },
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId } = req.params;
    const { startDate, endDate, sortBy, order } = req.query;

    const logs = await metricLogService.getAllLogsByMetricService({
      userId: userId,
      metricId: metricId,
      options: {
        startDate: startDate ? new Date(startDate as string) : undefined,
        endDate: endDate ? new Date(endDate as string) : undefined,
        sortBy: (sortBy as string) || "loggedAt",
        order: (order as "asc" | "desc") || "desc",
      },
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id, metricId } = req.params;

    const log = await metricLogService.getLogByIdService({
      metricId: metricId,
      userId: userId,
      logId: id,
    });
    successResponse(res, 200, { log });
  }
);

/**
 * * Update a Log
 * @route PUT /api/metrics/:metricId/logs/:id
 */
export const updateLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id, metricId } = req.params;
    const { logValue, type, loggedAt } = req.body;

    const log = await metricLogService.updateLogService({
      userId: userId,
      metricId: metricId,
      logId: id,
      updateData: {
        logValue,
        type,
        loggedAt,
      },
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id, metricId } = req.params;

    const log = await metricLogService.deleteLogService({
      userId: userId,
      metricId: metricId,
      logId: id,
    });
    successResponse(res, 200, { log }, "Log deleted successfully");
  }
);

/**
 * * Get Aggregated Stats for Metric Logs
 * @route GET /api/metrics/:metricId/logs/stats
 */
export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId } = req.params;

    const stats = await metricLogService.getAggregatedStats(userId, metricId);
    successResponse(res, 200, stats);
  }
);
