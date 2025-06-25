//src/controllers/metric-log.controller.ts

import { Request, Response, NextFunction } from "express";
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

/**
 * * Metric Log Controller
 * Handles CRUD operations for metric logs.
 */

/**
 * * Create a Log for a Metric
 * @route POST /api/metrics/:metricId/logs
 */
export const createMetricLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId, type, logValue, loggedAt } = req.body;

    const logDomain = await metricLogService.createLog({
      userId: userId,
      logData: {
        metricId,
        type,
        logValue,
        loggedAt,
      },
    });
    successResponse(
      res,
      201,
      { log: toMetricLogResponseDTO(logDomain) },
      "Metric Log created successfully"
    );
  }
);

/**
 * * Get All Logs for a Metric
 * @route GET /api/metrics/:metricId/logs
 */
export const getAllLogsByMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId, startDate, endDate, sortBy, order, page, limit } = req.query;

    const { logs, totalCount } =
      await metricLogService.getAllLogsByMetricService({
        userId: userId,
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
    successResponse(
      res,
      200,
      { logs: toMetricLogListResponseDTO(logs), total: totalCount },
      "Metric logs retrieved successfully"
    );
  }
);

/**
 * * Get Specific Log by ID
 * @route GET /api/metrics/:metricId/logs/:id
 */
export const getLogById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id } = req.params;
    const { metricId } = req.query; // metricId is now an optional query parameter for GET by ID

    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const logDomain = await metricLogService.getLogByIdService({
      userId: userId,
      logId: id,
    });
    // After fetching, verify that the log belongs to the specified metricId
    if (logDomain.metricId !== metricId) {
      throw new AppError("Log not found for the specified metric", 404);
    }
    successResponse(res, 200, { log: toMetricLogResponseDTO(logDomain) });
  }
);

/**
 * * Update a Log
 * @route PUT /api/metrics/:metricId/logs/:id
 */
export const updateLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id } = req.params;
    const { metricId } = req.query; // metricId is now an optional query parameter for PUT
    const { logValue, type, loggedAt } = req.body;

    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const logDomain = await metricLogService.updateLogService({
      userId: userId,
      logId: id,
      updateData: {
        logValue,
        type,
        loggedAt,
      },
    });
    // After updating, verify that the log belongs to the specified metricId
    if (logDomain.metricId !== metricId) {
      throw new AppError("Log not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { log: toMetricLogResponseDTO(logDomain) },
      "Log updated successfully"
    );
  }
);

/**
 * * Delete a Log
 * @route DELETE /api/metrics/:metricId/logs/:id
 */
export const deleteLog = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { id } = req.params;
    const { metricId } = req.query; // metricId is now an optional query parameter for DELETE

    if (!metricId) throw new AppError("metricId is required as a query parameter", 400); // Still require metricId for validation
    const logDomain = await metricLogService.deleteLogService({
      userId: userId,
      logId: id,
    });
    // After deleting, verify that the log belonged to the specified metricId
    if (logDomain.metricId !== metricId) {
      throw new AppError("Log not found for the specified metric", 404);
    }
    successResponse(
      res,
      200,
      { log: toMetricLogResponseDTO(logDomain) },
      "Log deleted successfully"
    );
  }
);

/**
 * * Get Aggregated Stats for Metric Logs
 * @route GET /api/metrics/:metricId/logs/stats
 */
export const getAggregatedStats = catchAsync(
  async (req: AuthRequest, res: Response) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId } = req.query;

    const stats = await metricLogService.getAggregatedStats(userId, metricId as string);
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
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const { metricId, count } = req.body as GenerateDummyMetricLogsRequestDTO;

    console.log(
      `Generating ${count} dummy logs for metric ${metricId} for user ${userId}`
    );

    const dummyLogs = await metricLogService.generateDummyLogsService({
      userId,
      metricId,
      count,
    });

    successResponse(
      res,
      201,
      { logs: toMetricLogListResponseDTO(dummyLogs) },
      `${count} dummy metric logs generated successfully`
    );
  }
);
