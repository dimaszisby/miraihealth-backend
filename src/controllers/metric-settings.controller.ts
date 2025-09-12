import { Response, NextFunction } from "express";
import { AuthRequest } from "@/types/request.context";
import AppError from "@/utils/AppError";
import catchAsync from "@/utils/catch-async";
import { successResponse } from "@/utils/response-formatter";
import * as metricSettingsService from "@/services/metric-settings.service";
import { toMetricSettingsResponseDTO } from "@/utils/mappers/metric-settings.mapper";
import { assertAuthenticated } from "@/utils/auth-guards";
import { listMetricSettingsViaCursorSchema } from "@/types/api/zod-metric-settings.schema";
import { listSettingsViaCursor } from "@/features/metric-settings/application/queries/listMetricSettings";

/**
 * * Create Metric Settings
 * @route POST /api/v1/metric-settings
 */
export const createMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const metricSettings =
      await metricSettingsService.createMetricSettingsService(
        req.user.id,
        req.body
      );
    const dto = toMetricSettingsResponseDTO(metricSettings);

    successResponse(res, 201, dto, "Metric Settings created successfully");
  }
);

/**
 * * Get All Settings for a Metric via Offset
 * @route GET /api/v1/metric-settings
 * @deprecated migrated to Cursor Based list fetching
 */
export const getAllMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    const metricSettings =
      await metricSettingsService.getAllMetricSettingsService(
        req.user.id,
        metricId as string // Pass metricId as optional filter
      );
    const dto = metricSettings.map(toMetricSettingsResponseDTO);

    successResponse(res, 200, dto, "Metric Settings retrieved successfully");
  }
);

/**
 * * Get All Settings for a Metric via Cursor
 * @route GET /api/v1/metric-settings
 */
export const getAllMetricSettingsViaCursor = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);
    const userId = req.user.id;

    const parsed = listMetricSettingsViaCursorSchema.query.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

    const page = await listSettingsViaCursor({
      userId,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const dto = {
      items: page.items.map(toMetricSettingsResponseDTO),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    successResponse(
      res,
      200,
      dto,
      "Metric Settings cursor fetched successfully"
    );
  }
);

/**
 * * Get Specific Metric Settings by ID
 * @route GET /api/v1/metric-settings/:id
 */
export const getMetricSettingsById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.getMetricSettingsByIdService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After fetching, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError(
        "Metric Settings not found for the specified metric",
        404
      );
    }
    const dto = toMetricSettingsResponseDTO(metricSettings);

    successResponse(res, 200, dto, "Metric Settings retrieved successfully");
  }
);

/**
 * * Update Metric Settings
 * @route PUT /api/v1/metric-settings/:id
 */
export const updateMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.updateMetricSettingsService(
        req.user.id,
        req.params.id,
        req.body
      );
    // After updating, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError(
        "Metric Settings not found for the specified metric",
        404
      );
    }

    const dto = toMetricSettingsResponseDTO(metricSettings);

    successResponse(res, 200, dto, "Metric settings updated successfully");
  }
);

/**
 * * Delete Metric Settings
 * @route /api/v1/metric-settings/:id
 */
export const deleteMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.deleteMetricSettingsService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After deleting, verify that the settings belonged to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError(
        "Metric Settings not found for the specified metric",
        404
      );
    }
    const dto = toMetricSettingsResponseDTO(metricSettings);

    successResponse(res, 200, dto, "Metric Settings deleted successfully");
  }
);

/**
 * * Update Goal Achievement
 * @route PATCH /api/v1/metric-settings/:id/achieve
 */
export const updateGoalAchievement = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const metricSettings =
      await metricSettingsService.updateGoalAchievementService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    // After updating, verify that the settings belong to the specified metricId
    if (metricSettings.metricId !== metricId) {
      throw new AppError(
        "Metric Settings not found for the specified metric",
        404
      );
    }
    const dto = toMetricSettingsResponseDTO(metricSettings);

    successResponse(res, 200, dto, "Goal achievement updated successfully");
  }
);

/**
 * * Update Display Options
 * @route /api/v1/metric-settings/:id/display
 */
export const updateDisplayOptions = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation

    const displayOptions =
      await metricSettingsService.updateDisplayOptionsService({
        userId: req.user.id,
        settingsId: req.params.id,
        displayOptions: req.body.displayOptions,
      });

    // After updating, verify that the settings belong to the specified metricId
    // This check is slightly different as it returns a partial DTO
    // We need to fetch the full settings to check metricId
    const fullMetricSettings =
      await metricSettingsService.getMetricSettingsByIdService({
        userId: req.user.id,
        settingsId: req.params.id,
      });
    if (fullMetricSettings.metricId !== metricId) {
      throw new AppError(
        "Metric Settings not found for the specified metric",
        404
      );
    }

    const dto = toMetricSettingsResponseDTO(fullMetricSettings);

    successResponse(res, 200, dto, "Display options updated successfully");
  }
);
