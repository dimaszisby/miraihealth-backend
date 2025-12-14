import { Request, Response, NextFunction } from "express";
import { buildMetricSettingsFeature } from "../../feature";
import catchAsync from "@/utils/catch-async";
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import { AuthRequest } from "@/types/request.context";
import { assertAuthenticated } from "@/utils/auth-guards";
import {
  toDisplayOptionsResponseDTO,
  toMetricSettingsResponseDTO,
} from "../mappers/MetricSettingsMapper";
import { DisplayOptionsDTO } from "./dto";
import {
  createMetricSettingsSchema,
  listMetricSettingsViaCursorSchema,
  updateMetricSettingsSchema,
  updateDisplayOptionsSchema,
} from "./schema.zod";

type Feature = ReturnType<typeof buildMetricSettingsFeature>;
let feature: Feature = buildMetricSettingsFeature();

export const overrideMetricSettingsFeature = (custom: Feature) => {
  feature = custom;
};

export const createMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const payload = createMetricSettingsSchema.body.parse(req.body);
    const created = await feature.createSettings.execute({
      userId: req.user.id,
      ...payload,
    });

    successResponse(
      res,
      201,
      toMetricSettingsResponseDTO(created.snapshot()),
      "Metric settings created successfully"
    );
  }
);

export const getAllMetricSettingsViaCursor = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const parsed = listMetricSettingsViaCursorSchema.query.parse(req.query);
    const result = await feature.listSettings.execute({
      userId: req.user.id,
      ...parsed,
    });

    successResponse(res, 200, {
      ...result,
      items: result.items.map((item) =>
        toMetricSettingsResponseDTO(item.snapshot())
      ),
    });
  }
);

export const getMetricSettingsById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const settings = await feature.getSettings.execute(
      req.user.id,
      req.params.id
    );
    successResponse(
      res,
      200,
      toMetricSettingsResponseDTO(settings.snapshot())
    );
  }
);

export const updateMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const payload = updateMetricSettingsSchema.body.parse(req.body);
    const updated = await feature.updateSettings.execute(
      req.user.id,
      req.params.id,
      payload
    );
    successResponse(
      res,
      200,
      toMetricSettingsResponseDTO(updated.snapshot()),
      "Metric settings updated successfully"
    );
  }
);

export const deleteMetricSettings = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    await feature.deleteSettings.execute(req.user.id, req.params.id);
    successResponse(res, 200, null, "Metric settings deleted successfully");
  }
);

export const updateGoalAchievement = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const updated = await feature.updateGoalAchievement.execute(
      req.user.id,
      req.params.id
    );
    successResponse(
      res,
      200,
      toMetricSettingsResponseDTO(updated.snapshot()),
      "Goal marked as achieved"
    );
  }
);

export const updateDisplayOptions = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { displayOptions } = updateDisplayOptionsSchema.body.parse(req.body);
    const updated = await feature.updateDisplayOptions.execute(
      req.user.id,
      req.params.id,
      displayOptions
    );
    successResponse(
      res,
      200,
      toDisplayOptionsResponseDTO(updated.snapshot().displayOptions),
      "Display options updated"
    );
  }
);
