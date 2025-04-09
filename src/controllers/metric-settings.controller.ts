// src/controllers/metric-settings.controller.ts

import { Request, Response, NextFunction } from "express";
import { AuthRequest } from "@/types/request.context";
import AppError from "@/utils/AppError";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import * as metricSettingsService from "@/services/metric-settings.service";
import {
  toDisplayOptionsResponseDTO,
  toMetricSettingsResponseDTO,
} from "@/utils/mappers/metric-settings.mapper";

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
      await metricSettingsService.createMetricSettingsService(
        req.user.id,
        req.params.metricId,
        req.body
      );
    successResponse(
      res,
      201,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
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

    const metricSettingsResponse = metricSettings.map(
      toMetricSettingsResponseDTO
    );
    successResponse(
      res,
      200,
      { metricSettings: metricSettingsResponse },
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
      { metricSettings: metricSettings },
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
      await metricSettingsService.updateMetricSettingsService(
        req.user.id,
        req.params.metricId,
        req.params.id,
        req.body
      );

    successResponse(
      res,
      200,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
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
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
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
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
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

    const displayOptions =
      await metricSettingsService.updateDisplayOptionsService({
        userId: req.user.id,
        metricId: req.params.metricId,
        settingsId: req.params.id,
        displayOptions: req.body.displayOptions,
      });
    successResponse(
      res,
      200,
      { displayOptions: toDisplayOptionsResponseDTO(displayOptions) },
      "Display options updated successfully"
    );
  }
);
