import { Response, NextFunction } from "express";
import AppError from "../utils/AppError.js";
import { successResponse } from "../utils/response-formatter.js";
import catchAsync from "../utils/catch-async.js";
import { AuthRequest } from "../types/request.context.js";
import * as metricLogService from "../services/metric-log.service.js";
import {
  toMetricLogListResponseDTO,
  toMetricLogResponseDTO,
} from "@/utils/mappers/metric-log.mapper";
import { GenerateDummyMetricLogsRequestDTO } from "@/types/dtos/metric-log.dto";
import { listMetricLogsViaCursorSchema } from "@/types/api/zod-metric-log.schema.js";
import { listLogsViaCursor } from "@/features/metric-log/application/queries/listMetricLogs.js";
import { assertAuthenticated } from "@/utils/auth-guards.js";
import logger from "@/utils/logger";

/**
 * * Create a Log for a Metric
 * @route POST /api/metric-logs/
 */
export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId, type, logValue, loggedAt } = req.body;

    const logDomain = await metricLogService.createLog({
      userId: req.user.id,
      logData: {
        metricId,
        type,
        logValue,
        loggedAt: loggedAt, // normalized on service
      },
    });
    const dto = toMetricLogResponseDTO(logDomain);

    successResponse(res, 201, dto, "Metric Log created successfully");
  }
);

/**
 * * Get All Logs for a Metric
 * @route GET /api/metrics-logs/
 * @deprecated migrate to cursor-based pagination
 */
export const getAllLogsByMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId, startDate, endDate, sortBy, order, page, limit } =
      req.query;

    const { logs, totalCount } =
      await metricLogService.getAllLogsByMetricService({
        userId: req.user.id,
        options: {
          metricId: metricId as string,
          startDate: startDate ? new Date(startDate as string) : undefined,
          endDate: endDate ? new Date(endDate as string) : undefined,
          sortBy: (sortBy as string) || "loggedAt",
          order: (order as "asc" | "desc") || "desc",
          page: page ? parseInt(page as string) : undefined,
          limit: limit ? parseInt(limit as string) : undefined,
        },
      });
    const dto = { logs: toMetricLogListResponseDTO(logs), total: totalCount };

    successResponse(res, 200, dto, "Metric logs retrieved successfully");
  }
);

/**
 * * Get All Metrics owned by User via Cursor
 * @route GET /api/metric-logs/
 */

export const getUserLogLibrariesViaCursor = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const parsed = listMetricLogsViaCursorSchema.query.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

    const page = await listLogsViaCursor({
      userId: req.user.id,
      limit,
      sort,
      q,
      filter,
      after,
      includeTotal,
    });

    const dto = {
      items: page.items.map(toMetricLogResponseDTO),
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

/**
 * * Get Specific Log by ID
 * @route GET /api/metric-logs/:id
 */
export const getLogById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId } = req.query; // opt params
    if (!metricId)
      throw new AppError("metricId is required as a query parameter", 400);

    const logDomain = await metricLogService.getLogByIdService({
      userId: req.user.id,
      logId: req.params.id,
    });

    // After fetching, verify that the log belongs to the specified metricId
    if (logDomain.metricId !== metricId) {
      throw new AppError("Log not found for the specified metric", 404);
    }
    const dto = toMetricLogResponseDTO(logDomain);

    successResponse(res, 200, dto);
  }
);

/**
 * * Update a Log
 * @route PUT /api/metric-logs/:id
 */
export const updateLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { logValue, type, loggedAt } = req.body;

    const logDomain = await metricLogService.updateLogService({
      userId: req.user.id,
      logId: req.params.id,
      updateData: {
        logValue,
        type,
        loggedAt: loggedAt, // normalized on service
      },
    });
    const dto = toMetricLogResponseDTO(logDomain);

    successResponse(res, 200, dto, "Log updated successfully");
  }
);

/**
 * * Delete a Log
 * @route DELETE /api/metric-logs/:id
 */
export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const logDomain = await metricLogService.deleteLogService({
      userId: req.user.id,
      logId: req.params.id,
    });
    const dto = toMetricLogResponseDTO(logDomain);

    successResponse(res, 200, dto, "Log deleted successfully");
  }
);

/**
 * * Get Aggregated Stats for Metric Logs
 * @route GET /api/metrics/:metricId/logs/stats
 */
export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    assertAuthenticated(req);

    const { metricId } = req.query;

    const stats = await metricLogService.getAggregatedStats(
      req.user.id,
      metricId as string
    );
    successResponse(res, 200, stats);
  }
);

/**
 * * ===== Controllers for Testing Purposes =====
 */

/**
 * * Generate Dummy Metric Logs for a Metric
 * @route POST /api/metrics/:metricId/logs/dummy
 */
export const generateDummyMetricLogs = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    assertAuthenticated(req);

    const { metricId, count } = req.body as GenerateDummyMetricLogsRequestDTO;

    logger.info("Generating dummy logs", {
      metricId,
      count,
      userId: req.user.id,
    });

    const dummyLogs = await metricLogService.generateDummyLogsService({
      userId: req.user.id,
      metricId,
      count,
    });
    const dto = toMetricLogListResponseDTO(dummyLogs);

    successResponse(
      res,
      201,
      dto,
      `${count} dummy metric logs generated successfully`
    );
  }
);
