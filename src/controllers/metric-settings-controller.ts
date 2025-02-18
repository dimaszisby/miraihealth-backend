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
    console.log("Raw Request Body:", req.body);

    // Validate that the parent Metric exists
    const metric = await Metric.findOne({ where: { id: metricId } });
    if (!metric) {
      console.error(`Metric with id ${metricId} not found.`);
      throw new AppError("Metric not found", 404);
    }
    console.log("Found parent metric:", metric.toJSON());

    // Apply default values if optional fields are undefined
    const finalAlertEnabled = alertEnabled !== undefined ? alertEnabled : false;
    const finalAlertThresholds =
      alertThresholds !== undefined ? alertThresholds : 80;
    const finalDisplayOptions =
      displayOptions !== undefined
        ? displayOptions
        : {
            showOnDashboard: true,
            priority: 1,
            chartType: "line",
            color: "#E897A3",
          };

    const creationData = {
      metricId,
      goalEnabled,
      goalType,
      goalValue,
      timeFrameEnabled,
      startDate,
      deadlineDate,
      alertEnabled: finalAlertEnabled,
      alertThresholds: finalAlertThresholds,
      displayOptions: finalDisplayOptions,
      isAchieved: false,
      isActive: true,
    };

    console.log("Final data for MetricSettings creation:", creationData);

    try {
      const metricSettings = await MetricSettings.create(creationData);
      console.log(
        "Successfully created MetricSettings:",
        metricSettings.toJSON()
      );
      successResponse(
        res,
        201,
        { metricSettings },
        "Metric Settings created successfully"
      );
    } catch (error) {
      console.error("Error creating MetricSettings:", (error as Error).stack);
      throw error;
    }
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

    // Return empty array if no settings found
    const metricSettings = settings || [];

    successResponse(
      res,
      200,
      { metricSettings },
      "Metric Settings retrieved successfully"
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

    const metricSettings = await MetricSettings.findOne({
      where: { id, metricId },
    });
    if (!metricSettings)
      throw new AppError("Settings for Metric not found", 404);

    successResponse(
      res,
      200,
      { metricSettings },
      "Metric Settings retrieved successfully"
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
      "Metric settings updated successfully"
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

    const metricSettings = await MetricSettings.findOne({
      where: { id, metricId },
    });
    if (!metricSettings)
      throw new AppError("Settings for Metric not found", 404);

    await metricSettings.destroy();

    successResponse(
      res,
      200,
      { metricSettings },
      "Metric Settings deleted successfully"
    );
  }
);

/**
 * * Update Goal Achievement
 * @route PATCH /api/metrics/:metricId/settings/:id/achieve
 */
export const updateGoalAchievement = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId, id } = req.params;

    if (!metricId || !id) {
      throw new AppError("Metric ID and Settings ID are required", 400);
    }

    const metricSettings = await MetricSettings.findOne({
      where: { id, metricId },
    });
    if (!metricSettings) {
      throw new AppError("Metric settings not found", 404);
    }

    // Update the achievement flag (for example, setting isAchieved to true)
    metricSettings.isAchieved = true;
    await metricSettings.save();

    successResponse(
      res,
      200,
      { metricSettings },
      "Goal achievement updated successfully"
    );
  }
);

/**
 * * Update Display Options
 * @route PATCH /api/metrics/:metricId/settings/:id/display
 */
export const updateDisplayOptions = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const { metricId, id } = req.params;
    const { displayOptions } = req.body;

    if (!metricId || !id) {
      throw new AppError("Metric ID and Settings ID are required", 400);
    }
    if (!displayOptions) {
      throw new AppError("Display options are required", 400);
    }

    const metricSettings = await MetricSettings.findOne({
      where: { id, metricId },
    });
    if (!metricSettings) {
      throw new AppError("Metric settings not found", 404);
    }

    // Update the display options (this could be a merge instead of a full replace if needed)
    metricSettings.displayOptions = displayOptions;
    await metricSettings.save();

    successResponse(
      res,
      200,
      { metricSettings },
      "Display options updated successfully"
    );
  }
);
