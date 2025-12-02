import { Op } from "sequelize";
import {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import { MetricLogDomain } from "@/types/domain/metric-log.domain";
import AppError from "@/utils/AppError";
import {
  redisClient,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import { findOwnedMetricLog, validateMetricAccess } from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainMetricLog,
  toDomainMetricLogs,
} from "@/utils/mappers/metric-log.mapper";
import { models } from "@/models";
import { parseIsoToDate } from "@/utils/date-io";
import { invalidateVizByMetric } from "@/features/analytics/infrastructure/cache/vizCache";

interface MetricLogBaseParams {
  userId: string;
  logId: string;
}

export interface LogQueryOptions {
  metricId?: string; // Make metricId optional for filtering
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

// TODO: Refactor and migrate to cursor
/**
 * Creates a date range filter for the Sequelize query.
 * @param startDate - Start date for the filter
 * @param endDate - End date for the filter
 * @returns An object containing the date range filter
 */
const createDateRangeFilter = (startDate?: Date, endDate?: Date) => {
  const dateRangeFilter: any = {};
  if (startDate) dateRangeFilter[Op.gte] = new Date(startDate);
  if (endDate) dateRangeFilter[Op.lte] = new Date(endDate);
  return dateRangeFilter;
};

/**
 * * CREATE
 * Create a new log for a given metric.
 */
export const createLog = async ({
  userId,
  logData,
}: {
  userId: string;
  logData: CreateMetricLogRequestDTO;
}): Promise<MetricLogDomain> => {
  const { metricId } = logData; // Extract metricId from logData
  if (!metricId) throw new AppError("metricId is required", 400); // Should be caught by Zod, but good for type safety

  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  const normalizedLoggedAt = logData.loggedAt
    ? (parseIsoToDate(logData.loggedAt) as Date)
    : new Date();

  const finalLogData = {
    ...logData,
    loggedAt: normalizedLoggedAt,
    type: logData.type ?? "manual",
  };

  // Prevent duplicate logs for the exact same timestamp for a given metric
  const existing = await models.MetricLog.findOne({
    where: { metricId, loggedAt: finalLogData.loggedAt },
  });
  if (existing) {
    throw new AppError(
      "A log entry already exists for this timestamp for this metric",
      400
    );
  }

  const created = await models.MetricLog.create(finalLogData);

  if (redisClient.isOpen) {
    await invalidateAllMetricLogsCache(userId, metricId, created.id);
  }

  return toDomainMetricLog(created);
};

/**
 * * Retrieve all logs for a given metric.
 * Supports optional filtering by a date range and sorting by logValue.
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param options - Metric log query options
 * @returns All metric log object
 */
/**
 * Builds the query options for retrieving metric logs.
 *
 * @param metricId - ID of the metric.
 * @param options - Optional query options for filtering and sorting.
 * @returns An object containing the query options.
 */
const buildQueryOptions = (options?: LogQueryOptions): any => {
  const queryOptions: any = {
    where: {},
  };

  if (options?.metricId) {
    queryOptions.where.metricId = options.metricId;
  }

  if (options?.startDate || options?.endDate) {
    queryOptions.where.loggedAt = createDateRangeFilter(
      options.startDate,
      options.endDate
    );
  }

  queryOptions.order = [
    [
      options?.sortBy || "loggedAt",
      options?.order?.toUpperCase() === "ASC" ? "ASC" : "DESC",
    ],
  ];

  if (options?.limit) {
    queryOptions.limit = options.limit;
    queryOptions.offset = ((options.page || 1) - 1) * options.limit;
  }

  return queryOptions;
};

/**
 * * GET ALL offset
 * Retrieves all logs for a given metric, with optional filtering, sorting, and pagination.
 * @deprecated replaced with cursor-based pagination
 */
export const getAllLogsByMetricService = async ({
  userId,
  options,
}: {
  userId: string;
  options?: LogQueryOptions;
}): Promise<{ logs: MetricLogDomain[]; totalCount: number }> => {
  const queryOptions = buildQueryOptions(options);

  // If metricId is provided, ensure the user has access to it.
  if (options?.metricId) {
    await validateMetricAccess(userId, options.metricId);
  } else {
    // If no metricId is provided, fetch all logs for metrics owned by the user
    // This requires joining with the Metric model to filter by userId
    queryOptions.include = [
      {
        model: models.Metric,
        as: "metric",
        where: { userId },
        attributes: [], // Don't fetch metric attributes, just use for filtering
      },
    ];
  }

  const { count, rows } = await models.MetricLog.findAndCountAll(queryOptions);

  return { logs: toDomainMetricLogs(rows), totalCount: count };
};

/**
 * * Retrieve a specific log by its ID and parent metric ID.
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param logId - ID of the specific log
 * @returns Metric log object
 */
export const getLogByIdService = async ({
  userId,
  logId,
}: MetricLogBaseParams): Promise<MetricLogDomain> => {
  // Find the log and ensure ownership. The db-helper function now handles metricId validation.
  const log = await findOwnedMetricLog(userId, logId);
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  return toDomainMetricLog(log);
};

/**
 * * UPDATE
 * Update a log for a given metric.
 */
interface UpdateLogParams extends MetricLogBaseParams {
  updateData: Partial<UpdateMetricLogRequestDTO>;
}

export const updateLogService = async ({
  userId,
  logId,
  updateData,
}: UpdateLogParams): Promise<MetricLogDomain> => {
  // Ensure Log Exists and is owned by the user. The db-helper function now handles metricId validation.
  const log = await findOwnedMetricLog(userId, logId);
  if (!log) throw new AppError("Log not found", 404);

  // sequelize type
  type Updatable = {
    logValue?: number;
    type?: "manual" | "automatic";
    loggedAt?: Date;
  };

  const patch: Updatable = {};

  if (typeof updateData.logValue !== "undefined")
    patch.logValue = updateData.logValue;
  if (typeof updateData.type !== "undefined") patch.type = updateData.type;

  if (typeof updateData.loggedAt !== "undefined") {
    const normalizedLoggedAt = parseIsoToDate(updateData.loggedAt) as Date;

    const existingLog = await models.MetricLog.findOne({
      where: { metricId: log.metricId, loggedAt: normalizedLoggedAt },
    });

    if (existingLog && existingLog.id !== logId) {
      throw new AppError(
        "A log already exists for this date for this metric",
        400
      );
    }

    patch.loggedAt = normalizedLoggedAt;
  }

  // Create update instance
  const updatedLog = await log.update(patch);

  // Reload the updated log to include its associated Metric data
  await updatedLog.reload({
    include: [
      {
        association: models.MetricLog.associations.metric,
        attributes: ["id", "userId"],
      },
    ],
  });

  // Fetch metricId safely
  const metricId = updatedLog.metricId || updatedLog.metric?.id;

  // Invalidate caches based on updatedLog.metric data
  if (redisClient.isOpen) {
    try {
      if (metricId) {
        await invalidateAllMetricLogsCache(userId, metricId, updatedLog.id);
      } else {
        // fallback: user-scoped invalidation
        await invalidateCacheByPattern(`logs:${userId}:*`);
      }
    } catch (e) {
      logger.warn("[CACHE] Invalidation failed after update; continuing");
    }
  }

  return toDomainMetricLog(updatedLog);
};

/**
 * * DELETE
 * Delete a log for a given metric.
 */
export const deleteLogService = async ({
  userId,
  logId,
}: MetricLogBaseParams): Promise<MetricLogDomain> => {
  // Ensure Log Exists and is owned by the user. The db-helper function now handles metricId validation.
  const log = await models.MetricLog.findOne({
    where: { id: logId },
    include: [
      {
        association: models.MetricLog.associations.metric, // <- safe
        attributes: ["id", "userId"],
        required: true,
        where: { userId }, // ownership check
      },
    ],
  });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  // 2) Hold associated info for cache invalidation
  const metricId = log.metric!.id;
  const ownerId = log.metric!.userId;

  // 3) Destroy without reloads afterwards
  await log.destroy();

  // Fetch metricId safely BEFORE destroy

  if (redisClient.isOpen && metricId) {
    await invalidateAllMetricLogsCache(userId, metricId, log.id);
  } else if (redisClient.isOpen && !metricId) {
    logger.warn(
      `[CACHE] Could not resolve metricId for log ${logId}, invalidating all user's logs cache!`
    );
    await invalidateCacheByPattern(`logs:${userId}:*`);
  }

  return toDomainMetricLog(log);
};

/**
 * * Get Aggregated Stats for Logs
 */
// TODO: Here are unfinished implementation, in the future this will be implemented into end-to-end pipeline for data visualization
export const getAggregatedStats = async (userId: string, metricId?: string) => {
  const whereClause: any = {};
  const queryOptions: any = { where: whereClause };

  // If metricId is provided, ensure the parent metric exists and enforce ownership.
  if (metricId) {
    await validateMetricAccess(userId, metricId);
    whereClause.metricId = metricId;
  } else {
    // If no metricId, fetch all logs for metrics owned by the user
    // This requires joining with the Metric model to filter by userId
    queryOptions.include = [
      {
        model: models.Metric,
        as: "metric",
        where: { userId },
        attributes: [],
      },
    ];
  }
  const logs = await models.MetricLog.findAll(queryOptions);
  if (logs.length === 0) {
    logger.warn("⚠️ No logs found, returning default stats.");
    return { average: 0, min: 0, max: 0 };
  }

  const logValues = logs.map(
    (log: InstanceType<typeof models.MetricLog>) => log.logValue
  );

  return {
    average:
      logValues.reduce((a: number, b: number) => a + b, 0) / logValues.length,
    min: Math.min(...logValues),
    max: Math.max(...logValues),
  };
};

/**
 * * ===== Services for Testing Purposes =====
 */

/**
 * * Generate Dummy Metric Logs
 * Generates a specified number of dummy metric log entries for a given metric.
 */
export const generateDummyLogsService = async ({
  userId,
  metricId,
  count,
}: {
  userId: string;
  metricId: string; // metricId is still required for dummy log generation
  count: number;
}): Promise<MetricLogDomain[]> => {
  await validateMetricAccess(userId, metricId);

  const dummyLogs = [];
  for (let i = 0; i < count; i++) {
    const logValue = parseFloat((Math.random() * 100).toFixed(2)); // Random float between 0 and 100
    const loggedAt = new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ); // Random date within the last 30 days

    const createdLog = await models.MetricLog.create({
      metricId,
      logValue,
      loggedAt,
      type: "manual",
    });
    dummyLogs.push(toDomainMetricLog(createdLog));
  }

  if (redisClient.isOpen) {
    await invalidateAllMetricLogsCache(userId, metricId);
  }

  return dummyLogs;
};

// * Helpers
/**
 * Invalidates all cache keys related to a user's logs for a specific metric,
 * including paginated, filtered, and stats keys.
 */
export async function invalidateAllMetricLogsCache(
  userId: string,
  metricId: string,
  logId?: string
) {
  logger.info(
    `[CACHE] Invalidating logs for user=${userId}, metric=${metricId}, log=${logId ?? "-"}`
  );

  // * Offset-based (legacy)
  // Invalidate all logs list queries for this metric
  await invalidateCacheByPattern(`logs:${userId}:${metricId}:*`);
  // Invalidate "all metrics" list (user dashboard or similar)
  await invalidateCacheByPattern(`logs:${userId}:all:*`);

  // * Cursor-based (current)
  // Target queries filtered by the metric
  await invalidateCacheByPattern(`logs-cursor:v*:${userId}:*fm:${metricId}*`);
  // Target “all metrics” queries for that user (no metricId filter)
  await invalidateCacheByPattern(`logs-cursor:v*:${userId}:*`);

  // * Stats
  // Invalidate stats for this metric
  await invalidateCache(`logStats:${userId}:${metricId}`);
  // Invalidate general stats for this user (if you have aggregate endpoints)
  await invalidateCache(`logStats:${userId}`);

  // * Viz
  await invalidateVizByMetric(userId, metricId);

  // * Detail
  // Invalidate single log cache if present
  if (logId) {
    await invalidateCache(`log:${userId}:${logId}`);
  }

  logger.info(
    `[CACHE] Cache invalidated for log:${logId ?? "-"}, and stats of user:${userId} and metric:${metricId}`
  );
}
