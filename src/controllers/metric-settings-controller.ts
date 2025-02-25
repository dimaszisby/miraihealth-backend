// src/controllers/metric-settings-controller.ts

import { Request, Response, NextFunction } from "express";
import catchAsync from "../utils/catch-async.js";
import { successResponse } from "../utils/response-formatter.js";
import * as metricSettingsService from "../services/metric-settings-service.js";

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
    const metricSettings = await metricSettingsService.createMetricSettings(
      req.params.metricId,
      req.body
    );
    successResponse(
      res,
      201,
      { metricSettings },
      "Metric Settings created successfully"
    );
  }
);

/**
 * * Get All Settings for a Metric
 * @route GET /api/metrics/:metricId/settings
 */
export const getAllMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    const metricSettings = await metricSettingsService.getAllMetricSettings(
      req.params.metricId
    );
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
    const metricSettings = await metricSettingsService.getMetricSettingsById(
      req.params.metricId,
      req.params.id
    );
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
    const metricSettings = await metricSettingsService.updateMetricSettings(
      req.params.metricId,
      req.params.id,
      req.body
    );
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
    const metricSettings = await metricSettingsService.deleteMetricSettings(
      req.params.metricId,
      req.params.id
    );
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
    const metricSettings = await metricSettingsService.updateGoalAchievement(
      req.params.metricId,
      req.params.id
    );
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
    const metricSettings = await metricSettingsService.updateDisplayOptions(
      req.params.metricId,
      req.params.id,
      req.body.displayOptions
    );
    successResponse(
      res,
      200,
      { metricSettings },
      "Display options updated successfully"
    );
  }
);
