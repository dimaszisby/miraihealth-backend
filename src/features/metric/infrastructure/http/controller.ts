import { NextFunction, Response } from "express";
import { GenerateDummyMetricsRequestDTO } from "@/types/dtos/metric.dto";
import { listMetricQueryViaCursor } from "@/types/api/zod-metric.schema";
import { buildMetricFeature } from "../../feature";
import { AuthRequest } from "@/types/request.context";
import logger from "@/utils/logger";
import {
  toMetricLibraryResponseDTO,
  toMetricResponseDTO,
  toUserMetricDetailResponseDTO,
} from "@/utils/mappers/metric.mapper";
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import catchAsync from "@/utils/catch-async";
import { assertAuthenticated } from "@/utils/auth-guards";

type MetricFeature = ReturnType<typeof buildMetricFeature>;
let metricFeature: MetricFeature = buildMetricFeature();

export const overrideMetricFeature = (feature: MetricFeature) => {
  metricFeature = feature;
};

export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = req.body;

    const metricDomain = await metricFeature.createMetric.execute({
      userId: req.user.id,
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    });

    const dto = toMetricResponseDTO(metricDomain);
    successResponse(res, 201, dto, "Metric created successfully");
  }
);

export const getUserMetricLibrariesViaCursor = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const parsed = listMetricQueryViaCursor.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

    const page = await metricFeature.listMetrics.execute({
      userId: req.user.id,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const dto = {
      items: page.items.map(toMetricLibraryResponseDTO),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    successResponse(res, 200, dto, "Metrics cursor fetched successfully");
  }
);

export const getUserDetailMetricById = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const includeRaw = String(req.query.include ?? "flat");
    const allowed = new Set(["settings", "category", "logs"]);

    let includes: Array<"settings" | "category" | "logs"> = [];
    if (includeRaw === "full") {
      includes = ["settings", "category", "logs"];
    } else if (includeRaw !== "flat") {
      includes = includeRaw
        .split(",")
        .map((s) => s.trim())
        .filter((s): s is "settings" | "category" | "logs" => allowed.has(s));
    }

    const logsLimit = Number(req.query.logsLimit ?? 20);

    const metric = await metricFeature.getMetricDetail.execute({
      userId: req.user.id,
      metricId: req.params.id,
      includes,
      logsLimit,
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    let dto;
    try {
      dto = toUserMetricDetailResponseDTO(metric);
    } catch (err) {
      logger.error("Error mapping metric to DTO:", err, metric);
      throw new AppError("Internal Server Error: mapping failed", 500);
    }

    successResponse(
      res,
      200,
      dto,
      "Metric extended detail retrieved successfully"
    );
  }
);

export const updateMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const updatedMetricDomain = await metricFeature.updateMetric.execute({
      userId: req.user.id,
      metricId: req.params.id,
      data: req.body,
    });
    const dto = toMetricResponseDTO(updatedMetricDomain);

    successResponse(res, 200, dto, "Metric updated successfully");
  }
);

export const deleteMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const metricDomain = await metricFeature.deleteMetric.execute({
      userId: req.user.id,
      metricId: req.params.id,
    });
    const dto = toMetricResponseDTO(metricDomain);

    successResponse(res, 200, dto, "Metric deleted successfully");
  }
);

export const generateDummyMetrics = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);
    const { count } = req.body as GenerateDummyMetricsRequestDTO;

    const dummyMetrics = await metricFeature.generateDummyMetrics.execute({
      userId: req.user.id,
      count,
    });
    const dto = dummyMetrics.map(toMetricResponseDTO);

    successResponse(
      res,
      201,
      dto,
      `${count} dummy metrics generated successfully`
    );
  }
);
