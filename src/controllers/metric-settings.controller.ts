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
        req.body,
      );
    successResponse(
      res,
      201,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
      "Metric Settings created successfully",
    );
  },
);

/**
 * * Get All Settings for a Metric
 * @route GET /api/metrics/:metricId/settings
 */
export const getAllMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    const metricSettings =
      await metricSettingsService.getAllMetricSettingsService(
        req.user.id,
        metricId as string, // Pass metricId as optional filter
      );

    const metricSettingsResponse = metricSettings.map(
      toMetricSettingsResponseDTO,
    );
    successResponse(
      res,
      200,
      { metricSettings: metricSettingsResponse },
      "Metric Settings retrieved successfully",
    );
  },
);

/**
 * * Get Specific Metric Settings by ID
 * @route GET /api/metrics/:metricId/settings/:id
 */
export const getMetricSettingsById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.getMetricSettingsByIdService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After fetching, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError("Metric Settings not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { metricSettings: metricSettings },
      "Metric Settings retrieved successfully",
    );
  },
);

/**
 * * Update Metric Settings
 * @route PUT /api/metrics/:metricId/settings/:id
 */
export const updateMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.updateMetricSettingsService(
        req.user.id,
        req.params.id,
        req.body,
      );
    // After updating, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError("Metric Settings not found for the specified metric", 404);
    }

    successResponse(
      res,
      200,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
      "Metric settings updated successfully",
    );
  },
);

/**
 * * Delete Metric Settings
 * @route DELETE /api/metrics/:metricId/settings/:id
 */
export const deleteMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.deleteMetricSettingsService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After deleting, verify that the settings belonged to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError("Metric Settings not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
      "Metric Settings deleted successfully",
    );
  },
);

/**
 * * Update Goal Achievement
 * @route PATCH /api/metrics/:metricId/settings/:id/achieve
 */
export const updateGoalAchievement = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.updateGoalAchievementService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After updating, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError("Metric Settings not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { metricSettings: toMetricSettingsResponseDTO(metricSettings) },
      "Goal achievement updated successfully",
    );
  },
);

/**
 * * Update Display Options
 * @route PATCH /api/metrics/:metricId/settings/:id/display
 */
export const updateDisplayOptions = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);

    const { metricId } = req.query;
    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const displayOptions =
      await metricSettingsService.updateDisplayOptionsService({
        userId: req.user.id,
        settingsId: req.params.id,
        displayOptions: req.body.displayOptions,
      });
    // After updating, verify that the settings belong to the specified metricId
    // This check is slightly different as it returns a partial DTO
    // We need to fetch the full settings to check metricId
    const fullMetricSettings = await metricSettingsService.getMetricSettingsByIdService({
      userId: req.user.id,
      settingsId: req.params.id,
    });
    if (fullMetricSettings.metricId !== metricId) {
      throw new AppError("Metric Settings not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { displayOptions: toDisplayOptionsResponseDTO(displayOptions) },
      "Display options updated successfully",
    );
  },
);
