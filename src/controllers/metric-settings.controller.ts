// src/controllers/metric-settings-controller.ts

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "../types/requestContext.js";
import AppError from "../utils/AppError.js";
import catchAsync from "../utils/catch-async.js";
import { successResponse } from "../utils/response-formatter.js";
import * as metricSettingsService from "../services/metric-settings.service.js";

/**
 * * Metric Settings Controller
 * Handles CRUD operations for metric settings.
 */

/**
 * * Create Metric Settings
 * @route POST /api/metrics/:metricId/settings
 */
export const createMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.createMetricSettingsService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingData: req.body,
      });
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.getAllMetricSettingsService(
        req.user.id,
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.getMetricSettingsByIdService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
      });
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.updateMetricSettingsService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
        updateData: req.body,
      });
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.deleteMetricSettingsService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
      });
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.updateGoalAchievementService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
      });
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const metricSettings =
      await metricSettingsService.updateDisplayOptionsService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
        displayOptions: req.body,
      });
    successResponse(
      res,
      200,
      { metricSettings },
      "Display options updated successfully"
    );
  }
);
