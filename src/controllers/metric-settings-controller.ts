import { Request, Response, NextFunction } from "express";
import { Metric } from "../models/metric.js";
import { MetricSettings } from "../models/metric-settings.js";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";

/**
 * * Metric Settings Controller
 * Handles CRUD operations for metric settings.
 */

// Extend Express Request to include `user`
export interface AuthRequest extends Request {
  user?: { id: string };
}

/**
 * * Create Metric Settings
 * @route POST /api/metrics/:metricId/settings
 */
export const createMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;

    if (!metricId) throw new AppError("Metric ID is required", 400);

    const {
      goalEnabled,
      goalType,
      goalValue,
      timeFrameEnabled,
      startDate,
      deadlineDate,
      alertEnabled,
      alertThresholds,
      displayOptions,
    } = req.body;

    console.log(
      `Received request to create settings for metricId: ${metricId}`
    );
    console.log("Request Body:", req.body);

    // Validate that the parent Metric exists
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) throw new AppError("Metric not found", 404);

    const metricSettings = await MetricSettings.create({
      metricId,
      goalEnabled,
      goalType,
      goalValue,
      timeFrameEnabled,
      startDate,
      deadlineDate,
      alertEnabled,
      alertThresholds,
      displayOptions,
      isAchieved: false,
      isActive: true,
    });

    successResponse(
      res,
      201,
      { metricSettings },
      "Metric Settings created successfully."
    );
  }
);

/**
 * * Get All Settings for a Metric
 * @route GET /api/metrics/:metricId/settings
 */
export const getAllMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId } = req.params;

    if (!metricId) throw new AppError("Metric ID is required", 400);

    const settings = await MetricSettings.findAll({ where: { metricId } });

    if (!settings || settings.length === 0)
      throw new AppError("No settings found for the given Metric", 404);

    successResponse(
      res,
      200,
      { settings },
      "Metric Settings retrieved successfully."
    );
  }
);

/**
 * * Get Specific Metric Settings by ID
 * @route GET /api/metrics/:metricId/settings/:id
 */
export const getMetricSettingsById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId, id } = req.params;

    if (!metricId || !id)
      throw new AppError("Metric ID and Settings ID are required", 400);

    const settings = await MetricSettings.findOne({ where: { id, metricId } });

    if (!settings) throw new AppError("Settings for Metric not found", 404);

    successResponse(
      res,
      200,
      { settings },
      "Metric Settings retrieved successfully."
    );
  }
);

/**
 * * Update Metric Settings
 * @route PUT /api/metrics/:metricId/settings/:id
 */
export const updateMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId, id } = req.params;
    const updates = req.body;

    if (!metricId || !id)
      throw new AppError("Metric ID and Settings ID are required", 400);

    const metricSettings = await MetricSettings.findOne({
      where: { id, metricId },
    });

    if (!metricSettings) throw new AppError("Metric settings not found", 404);

    await metricSettings.update(updates);

    successResponse(
      res,
      200,
      { metricSettings },
      "Metric settings updated successfully."
    );
  }
);

/**
 * * Delete Metric Settings
 * @route DELETE /api/metrics/:metricId/settings/:id
 */
export const deleteMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId, id } = req.params;

    if (!metricId || !id)
      throw new AppError("Metric ID and Settings ID are required", 400);

    const settings = await MetricSettings.findOne({ where: { id, metricId } });

    if (!settings) throw new AppError("Settings for Metric not found", 404);

    await settings.destroy();

    successResponse(
      res,
      200,
      { settings },
      "Metric settings deleted successfully."
    );
  }
);
