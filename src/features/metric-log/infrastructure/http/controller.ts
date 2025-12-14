import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import catchAsync from "@/utils/catch-async";
import { AuthRequest } from "@/types/request.context";
import {
  toMetricLogListResponseDTO,
  toMetricLogResponseDTO,
} from "@/utils/mappers/metric-log.mapper";
import {
  createMetricLogSchema,
  deleteMetricLogSchema,
  generateDummyMetricLogsSchema,
  getAggregatedStatsSchema,
  getMetricLogByIdSchema,
  listMetricLogsViaCursorSchema,
  updateMetricLogSchema,
} from "./schema.zod";
import { assertAuthenticated } from "@/utils/auth-guards";
import logger from "@/utils/logger";
import { buildMetricLogFeature } from "@/features/metric-log/feature";
import { pickValidated } from "@/shared/middleware/validated";

type MetricLogFeature = ReturnType<typeof buildMetricLogFeature>;
let metricLogFeature: MetricLogFeature = buildMetricLogFeature();

export const overrideMetricLogFeatureForTest = (feature: MetricLogFeature) => {
  metricLogFeature = feature;
};

export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const { body } = pickValidated(createMetricLogSchema)(req);
    const { metricId, type, logValue, loggedAt } = body;

    const logDomain = await metricLogFeature.createLog.execute({
      userId: req.user.id,
      metricId,
      type,
      logValue,
      loggedAt,
    });
    const dto = toMetricLogResponseDTO(logDomain);

    successResponse(res, 201, dto, "Metric Log created successfully");
  }
);

export const getUserLogLibrariesViaCursor = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { query } = pickValidated(listMetricLogsViaCursorSchema)(req);
    const { limit, sort, q, after, includeTotal, filter } = query;

    const page = await metricLogFeature.listLogs.execute({
      userId: req.user.id,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const dto = {
      items: toMetricLogListResponseDTO(page.items),
      nextCursor: page.nextCursor,
      sort: page.sort,
      limit: page.limit,
      ...(page.q ? { q: page.q } : {}),
      ...(page.filter ? { filter: page.filter } : {}),
      ...(includeTotal ? { totalCount: page.totalCount ?? 0 } : {}),
    };

    successResponse(res, 200, dto, "Metric Logs cursor fetched successfully");
  }
);

export const getLogById = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { params, query } = pickValidated(getMetricLogByIdSchema)(req);
    const { metricId } = query;

    const logDomain = await metricLogFeature.getLog.execute({
      userId: req.user.id,
      logId: params.id,
    });

    if (logDomain.metricId !== metricId) {
      throw new AppError("Log not found for the specified metric", 404);
    }

    successResponse(res, 200, toMetricLogResponseDTO(logDomain));
  }
);

export const updateLog = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { body, params } = pickValidated(updateMetricLogSchema)(req);
    const { logValue, type, loggedAt } = body;

    const logDomain = await metricLogFeature.updateLog.execute({
      userId: req.user.id,
      logId: params.id,
      updates: { logValue, type, loggedAt },
    });

    successResponse(res, 200, toMetricLogResponseDTO(logDomain), "Log updated successfully");
  }
);

export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { params } = pickValidated(deleteMetricLogSchema)(req);
    const logDomain = await metricLogFeature.deleteLog.execute({
      userId: req.user.id,
      logId: params.id,
    });

    successResponse(res, 200, toMetricLogResponseDTO(logDomain), "Log deleted successfully");
  }
);

export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const { query } = pickValidated(getAggregatedStatsSchema)(req);
    const stats = await metricLogFeature.getStats.execute({
      userId: req.user.id,
      metricId: query.metricId,
    });
    successResponse(res, 200, stats);
  }
);

export const generateDummyMetricLogs = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { body } = pickValidated(generateDummyMetricLogsSchema)(req);
    const { metricId, count } = body;

    logger.info("Generating dummy logs", {
      metricId,
      count,
      userId: req.user.id,
    });

    const dummyLogs = await metricLogFeature.generateDummyLogs.execute({
      userId: req.user.id,
      metricId,
      count,
    });

    successResponse(
      res,
      201,
      toMetricLogListResponseDTO(dummyLogs),
      `${count} dummy metric logs generated successfully`
    );
  }
);
