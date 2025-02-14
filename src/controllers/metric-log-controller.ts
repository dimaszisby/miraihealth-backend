import { Request, Response, NextFunction } from "express";
import { MetricLog } from "../models/metric-log.js";
import { Metric } from "../models/metric.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";

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
    const { type, logValue } = req.body;

    if (!metricId) throw new AppError("Metric ID is required", 400);
    if (!logValue || isNaN(logValue))
      throw new AppError("Valid logValue is required", 400);

    console.log(
      `Received request to create MetricLog for metricId: ${metricId}`
    );
    console.log("Request Body:", req.body);

    // Verify that the parent Metric exists
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) throw new AppError("Parent Metric not found", 404);

    const log = await MetricLog.create({
      metricId: metric.id,
      type: type || "manual", // Default to "manual"
      logValue,
    });

    successResponse(res, 201, { log }, "Metric Log created successfully.");
  }
);

/**
 * * Get All Logs for a Metric
 * @route GET /api/metrics/:metricId/logs
 */
export const getAllLogsByMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;

    if (!metricId) throw new AppError("Metric ID is required", 400);

    const logs = await MetricLog.findAll({ where: { metricId } });

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

    if (!metricId || !id)
      throw new AppError("Metric ID and Log ID are required", 400);

    const log = await MetricLog.findOne({ where: { id, metricId } });

    if (!log) throw new AppError("Log not found", 404);

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
    const { logValue, type } = req.body;

    if (!metricId || !id)
      throw new AppError("Metric ID and Log ID are required", 400);
    if (logValue !== undefined && isNaN(logValue))
      throw new AppError("Valid logValue is required", 400);

    const log = await MetricLog.findOne({ where: { id, metricId } });

    if (!log) throw new AppError("Log not found", 404);

    await log.update({ logValue, type });

    successResponse(res, 200, { log }, "Log updated successfully.");
  }
);

/**
 * * Delete a Log
 * @route DELETE /api/metrics/:metricId/logs/:id
 */
export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { id, metricId } = req.params;

    if (!metricId || !id)
      throw new AppError("Metric ID and Log ID are required", 400);

    const log = await MetricLog.findOne({ where: { id, metricId } });

    if (!log) throw new AppError("Log not found", 404);

    await log.destroy();

    successResponse(res, 200, { log }, "Log deleted successfully.");
  }
);
