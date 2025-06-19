// src/services/metric-log.service.ts

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

import db from "@/models/index";
import { Op, Order } from "sequelize";
import {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import { MetricLogDomain } from "@/types/domain/metric-log.domain";
import AppError from "@/utils/AppError";
import { redisClient, invalidateCache } from "@/utils/redis-client";
import { findOwnedMetricLog, validateMetricAccess } from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainMetricLog,
  toDomainMetricLogs,
} from "@/utils/mappers/metric-log.mapper";

const { MetricLog } = db;

/**
 * * Metric Log Service
 * Handles all business logic related to metric log.
 */

interface MetricLogBaseParams {
  userId: string;
  metricId: string;
  logId: string;
}

export interface LogQueryOptions {
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  order?: "asc" | "desc";
  page?: number;
  limit?: number;
}

/**
 * * Create a new log for a given metric.
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param logData - Metric log data
 * @returns Created metric log object
 */
export const createLog = async ({
  userId,
  metricId,
  logData,
}: {
  userId: string;
  metricId: string;
  logData: CreateMetricLogRequestDTO;
}): Promise<MetricLogDomain> => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  const finalLogData = {
    ...logData,
    loggedAt: logData.loggedAt ?? new Date(), // fallback to current timestamp
    type: logData.type ?? "manual",
  };

  // Prevent duplicate logs for the exact same timestamp
  const existing = await MetricLog.findOne({
    where: { metricId, loggedAt: finalLogData.loggedAt },
  });
  if (existing) {
    throw new AppError("A log entry already exists for this timestamp", 400);
  }

  const created = await MetricLog.create({ metricId, ...finalLogData });

  // Invalidate logs list and aggregated stats cache for this metric
  if (redisClient.isOpen) {
    await invalidateCache(`logs:${userId}:${metricId}`);
    await invalidateCache(`logStats:${userId}:${metricId}`);
    logger.info(
      `♻️ Cache invalidated for logs and stats of metric:${metricId}`
    );
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
const buildQueryOptions = (
  metricId: string,
  options?: LogQueryOptions
): any => {
  const queryOptions: any = {
    where: { metricId },
  };

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
 * Retrieves all logs for a given metric, with optional filtering, sorting, and pagination.
 *
 * @param userId - ID of the user.
 * @param metricId - ID of the metric.
 * @param options - Optional query options for filtering, sorting, and pagination.
 * @returns A promise that resolves to an object containing an array of metric logs and the total count.
 */
export const getAllLogsByMetricService = async ({
  userId,
  metricId,
  options,
}: {
  userId: string;
  metricId: string;
  options?: LogQueryOptions;
}): Promise<{ logs: MetricLogDomain[]; totalCount: number }> => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  const queryOptions = buildQueryOptions(metricId, options);

  const { count, rows } = await MetricLog.findAndCountAll(queryOptions);

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
  metricId,
  logId,
}: MetricLogBaseParams): Promise<MetricLogDomain> => {
  // Ensure the parent metric exists and enforce ownership.
  await findOwnedMetricLog(userId, metricId, logId);

  // Retrieve and return the log
  const log = await MetricLog.findOne({
    where: { id: logId, metricId: metricId },
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"], // ✅ Include metric owner information
      },
    ],
  });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  return toDomainMetricLog(log);
};

/**
 * Update a log for a given metric.
 * @param metricId - ID of the metric
 * @param userId - ID of the user
 * @param id - ID of the specific log
 * @returns Updated metric log object
 */
interface UpdateLogParams extends MetricLogBaseParams {
  updateData: Partial<UpdateMetricLogRequestDTO>;
}

export const updateLogService = async ({
  userId,
  metricId,
  logId,
  updateData,
}: UpdateLogParams): Promise<MetricLogDomain> => {
  // Ensure Log Exists
  const log = await findOwnedMetricLog(userId, metricId, logId);

  if (updateData.loggedAt) {
    const existingLog = await MetricLog.findOne({
      where: { metricId, loggedAt: updateData.loggedAt },
    });
    if (existingLog)
      throw new AppError("A log already exists for this date", 400);
  }

  // Create update instance
  const updatedLog = await log.update(updateData);

  // Reload the updated log to include its associated Metric data
  await updatedLog.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  // Invalidate caches based on updatedLog.metric data
  if (redisClient.isOpen && updatedLog.metric) {
    await invalidateCache(
      `log:${updatedLog.metric.userId}:${updatedLog.metric.id}:${updatedLog.id}`
    );
    await invalidateCache(
      `logs:${updatedLog.metric.userId}:${updatedLog.metric.id}`
    );
    await invalidateCache(
      `logStats:${updatedLog.metric.userId}:${updatedLog.metric.id}`
    );
    logger.info(
      `♻️ Cache invalidated for log:${updatedLog.id}, logs, and stats of metric:${updatedLog.metric.id}`
    );
  }

  return toDomainMetricLog(updatedLog);
};

/**s
 * Delete a log for a given metric.
 * @param metricId - ID of the metric
 * @param userId - ID of the user
 * @param id - ID of the specific log
 */
export const deleteLogService = async ({
  metricId,
  userId,
  logId,
}: MetricLogBaseParams): Promise<MetricLogDomain> => {
  // Ensure Log Exists
  const log = await findOwnedMetricLog(userId, metricId, logId);

  // Reload to include Metric association (if not already present)
  await log.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && log.metric) {
    await invalidateCache(
      `log:${log.metric.userId}:${log.metric.id}:${log.id}`
    );
    await invalidateCache(`logs:${log.metric.userId}:${log.metric.id}`);
    await invalidateCache(`logStats:${log.metric.userId}:${log.metric.id}`);
    logger.info(
      `♻️ Cache invalidated for log:${log.id}, logs, and stats of metric:${log.metric.id}`
    );
  }

  await log.destroy();

  return toDomainMetricLog(log);
};

/**
 * * Get Aggregated Stats for Logs
 * @param metricId - ID of the metric
 * @param userId - ID of the user
 * @returns Numbers of average, min, max of aggregated stats
 */
// TODO: Here are unfinished implementation, in the future this will be implemented into end-to-end pipeline for data visualization
export const getAggregatedStats = async (userId: string, metricId: string) => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  // Fetch logs for this metric
  const logs = await MetricLog.findAll({ where: { metricId } });
  if (logs.length === 0) {
    logger.warn("⚠️ No logs found, returning default stats.");
    return { average: 0, min: 0, max: 0 };
  }

  const logValues = logs.map((log: typeof MetricLog) => log.logValue);

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
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param count - Number of dummy logs to generate
 * @returns Array of created metric log objects
 */
export const generateDummyLogsService = async ({
  userId,
  metricId,
  count,
}: {
  userId: string;
  metricId: string;
  count: number;
}): Promise<MetricLogDomain[]> => {
  await validateMetricAccess(userId, metricId);

  const dummyLogs = [];
  for (let i = 0; i < count; i++) {
    const logValue = parseFloat((Math.random() * 100).toFixed(2)); // Random float between 0 and 100
    const loggedAt = new Date(
      Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
    ); // Random date within the last 30 days

    const createdLog = await MetricLog.create({
      metricId,
      logValue,
      loggedAt,
      type: "manual",
    });
    dummyLogs.push(toDomainMetricLog(createdLog));
  }

  if (redisClient.isOpen) {
    await invalidateCache(`logs:${userId}:${metricId}`);
    await invalidateCache(`logStats:${userId}:${metricId}`);
    logger.info(
      `♻️ Cache invalidated for logs and stats of metric:${metricId} after dummy generation`
    );
  }

  return dummyLogs;
};

/**
 * * ===== Services for Testing Purposes =====
 */
