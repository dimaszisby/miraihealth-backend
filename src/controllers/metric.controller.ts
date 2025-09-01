import { Response, NextFunction } from "express";
import * as MetricService from "@/services/metric.service";
import { MetricDomain } from "@/types/domain/metric.domain";
import { GenerateDummyMetricsRequestDTO } from "@/types/dtos/metric.dto";
import { listMetricQueryViaCursor } from "@/types/api/zod-metric.schema";
import { listMetricsViaCursor } from "@/features/metric/application/queries/ListMetrics";
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

/**
 * * Create a new Metric
 * @route POST /api/metrics
 */
export const createMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const {
      categoryId,
      originalMetricId,
      name,
      description,
      defaultUnit,
      isPublic,
    } = req.body;

    const metricDomain: MetricDomain = await MetricService.createMetricService(
      userId,
      {
        categoryId,
        originalMetricId,
        name,
        description,
        defaultUnit,
        isPublic,
      }
    );
    const dto = toMetricResponseDTO(metricDomain);

    successResponse(res, 201, dto, "Metric created successfully");
  }
);

/**
 * * Get All Metrics owned by User
 * @deprecated replaced with cursor fetch method
 * @route GET /api/metrics
 */
export const getUserMetricLibraries = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    // Sanitize and validate pagination params
    let { page = 1, limit = 20 } = req.query;
    page = Number(page);
    limit = Number(limit);

    if (isNaN(page) || page < 1) page = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 20; // cap limit to prevent abuse

    // Forward all params, including sanitized pagination
    const { metricsDomain, total } =
      await MetricService.getUserMetricLibrariesService(userId, {
        ...req.query,
        page,
        limit,
      });

    const metricsResponseDTO = metricsDomain.map((metric) =>
      toMetricLibraryResponseDTO(metric)
    );

    const dto = {
      metrics: metricsResponseDTO,
      total: total,
    };

    successResponse(res, 200, dto, "Metrics fetched successfully");
  }
);

/**
 * * Get All Metrics owned by User via Cursor
 * @route GET /api/metrics
 */

export const getUserMetricLibrariesViaCursor = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;

    const parsed = listMetricQueryViaCursor.parse(req.query);
    const { limit, sort, q, after, includeTotal, filter } = parsed;

    const page = await listMetricsViaCursor({
      userId,
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

/**
 * * Get specific User Metric by Id
 * @route GET /api/metrics/:id
 */
export const getUserDetailMetricById = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

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

    const metric = await MetricService.getUserMetricDetailService(userId, id, {
      includes,
      logsLimit,
    });
    if (!metric) {
      throw new AppError("Metric not found", 404);
    }

    // Defensive: wrap mapping
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

// Developer Note: This function is WAS deprecated due to API endpoint changes (from flat to query params structure), but will be reimplemented for metric details retrieval.
// Proposal for future development: getPublicMetricId -> Public metrics retrieval that could be used for public templates or shared metrics.
// /**
//  * @deprecated This function is deprecated due to API endpoint changes from flat to query params structure.
//  * * Get specific Metric by Id
//  * @route GET /api/metrics/:id
//  */
// export const getMetricById = catchAsync(
//   async (req: AuthRequest, res: Response, next: NextFunction) => {
//     if (!req.user?.id) throw new AppError("User not authenticated", 401);
//     const userId = req.user.id;
//     const { id } = req.params;

//     const metric = await MetricService.getUserMetricByIdService(userId, id);
//     if (!metric) {
//       throw new AppError("Metric not found", 404);
//     }
//     successResponse(
//       res,
//       200,
//       toMetricResponseDTO(metric),
//       "Metric retrieved successfully"
//     );
//   }
// );

/**
 * * Update Metric
 * @route PUT /api/metrics/:id
 */
export const updateMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const updatedMetricDomain: MetricDomain =
      await MetricService.updateMetricService(id, userId, req.body);
    const dto = toMetricResponseDTO(updatedMetricDomain);

    successResponse(res, 200, dto, "Metric updated successfully");
  }
);

/**
 * * Delete Metric
 * @route DELETE /api/metrics/:id
 */
export const deleteMetric = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { id } = req.params;

    const metricDomain: MetricDomain = await MetricService.deleteMetricService(
      userId,
      id
    );
    const dto = toMetricResponseDTO(metricDomain);

    successResponse(res, 200, dto, "Metric deleted successfully");
  }
);

/**
 * * ===== Controllers for Testing Purposes =====
 */

/**
 * * Generate Dummy Metrics
 * @route POST /api/metrics/dummy
 */
export const generateDummyMetrics = catchAsync(
  async (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user?.id) throw new AppError("User not authenticated", 401);
    const userId = req.user.id;
    const { count } = req.body as GenerateDummyMetricsRequestDTO;

    const dummyMetrics = await MetricService.generateDummyMetricsService(
      userId,
      count
    );
    const dto = dummyMetrics.map(toMetricResponseDTO);

    successResponse(
      res,
      201,
      dto,
      `${count} dummy metrics generated successfully`
    );
  }
);
