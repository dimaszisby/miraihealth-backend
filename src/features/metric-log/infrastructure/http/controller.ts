import { Response, NextFunction } from "express";
import AppError from "@/utils/AppError";
import { successResponse } from "@/utils/response-formatter";
import catchAsync from "@/utils/catch-async";
import { AuthRequest } from "@/types/request.context";
import {
  toMetricLogListResponseDTO,
  toMetricLogResponseDTO,
} from "@/utils/mappers/metric-log.mapper";
import { GenerateDummyMetricLogsRequestDTO } from "./dto";
import { listMetricLogsViaCursorSchema } from "./schema.zod";
import { assertAuthenticated } from "@/utils/auth-guards";
import logger from "@/utils/logger";
import { buildMetricLogFeature } from "@/features/metric-log/feature";

type MetricLogFeature = ReturnType<typeof buildMetricLogFeature>;
let metricLogFeature: MetricLogFeature = buildMetricLogFeature();

export function __setMetricLogFeature(feature: MetricLogFeature) {
  metricLogFeature = feature;
}

export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, _next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId, type, logValue, loggedAt } = req.body;

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

    const parsed = listMetricLogsViaCursorSchema.query.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

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

    const { metricId } = req.query;
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400);

    const logDomain = await metricLogFeature.getLog.execute({
      userId: req.user.id,
      logId: req.params.id,
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

    const { logValue, type, loggedAt } = req.body;

    const logDomain = await metricLogFeature.updateLog.execute({
      userId: req.user.id,
      logId: req.params.id,
      updates: { logValue, type, loggedAt },
    });

    successResponse(res, 200, toMetricLogResponseDTO(logDomain), "Log updated successfully");
  }
);

export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const logDomain = await metricLogFeature.deleteLog.execute({
      userId: req.user.id,
      logId: req.params.id,
    });

    successResponse(res, 200, toMetricLogResponseDTO(logDomain), "Log deleted successfully");
  }
);

export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);
    const stats = await metricLogFeature.getStats.execute({
      userId: req.user.id,
      metricId: req.query.metricId as string | undefined,
    });
    successResponse(res, 200, stats);
  }
);

export const generateDummyMetricLogs = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { metricId, count } = req.body as GenerateDummyMetricLogsRequestDTO;

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
