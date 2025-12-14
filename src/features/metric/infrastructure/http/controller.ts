import { NextFunction, Response } from "express";
import {
  createMetricSchema,
  deleteMetricSchema,
  generateDummyMetricsSchema,
  getAllMetricsViaCursorSchema,
  getMetricSchema,
  updateMetricSchema,
} from "./schema.zod";
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
import { buildAnalyticsFeature } from "@/features/analytics/feature";
import { pickValidated } from "@/shared/middleware/validated";

type MetricFeature = ReturnType<typeof buildMetricFeature>;
let metricFeature: MetricFeature = buildMetricFeature();

export const overrideMetricFeatureForTest = (feature: MetricFeature) => {
  metricFeature = feature;
};

type AnalyticsFeature = ReturnType<typeof buildAnalyticsFeature>;
let analyticsFeature: AnalyticsFeature = buildAnalyticsFeature();

export const overrideMetricTrendFeatureForTest = (
  feature: AnalyticsFeature
) => {
  analyticsFeature = feature;
};

export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const { body } = pickValidated(createMetricSchema)(req);
    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = body;

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

    const { query } = pickValidated(getAllMetricsViaCursorSchema)(req);
    const { limit, sort, q, after, includeTotal, filter } = query;

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

    const { params, query } = pickValidated(getMetricSchema)(req);
    const includeRaw = query.include ?? "flat";
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

    const logsLimit = query.logsLimit ?? 20;

    const metric = await metricFeature.getMetricDetail.execute({
      userId: req.user.id,
      metricId: params.id,
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

    const { body, params } = pickValidated(updateMetricSchema)(req);
    const updatedMetricDomain = await metricFeature.updateMetric.execute({
      userId: req.user.id,
      metricId: params.id,
      data: body,
    });
    const dto = toMetricResponseDTO(updatedMetricDomain);

    successResponse(res, 200, dto, "Metric updated successfully");
  }
);

export const deleteMetric = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const { params } = pickValidated(deleteMetricSchema)(req);
    const metricDomain = await metricFeature.deleteMetric.execute({
      userId: req.user.id,
      metricId: params.id,
    });
    const dto = toMetricResponseDTO(metricDomain);

    successResponse(res, 200, dto, "Metric deleted successfully");
  }
);

export const generateDummyMetrics = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);
    const { body } = pickValidated(generateDummyMetricsSchema)(req);
    const { count } = body;

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

export const handleMetricTrend = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const data = await analyticsFeature.getMetricTrend.execute({
      userId: req.user.id,
      metricId: req.params.metricId ?? req.params.id,
    });

    successResponse(res, 200, data);
  }
);
