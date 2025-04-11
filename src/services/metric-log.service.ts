// src/services/metric-log.service.ts

import db from "@/models/index";
import { Op, Order } from "sequelize";
import {
  CreateMetricLogRequestDTO,
  UpdateMetricLogRequestDTO,
} from "@/types/dtos/metric-log.dto";
import { MetricLogDomain } from "@/types/domain/metric-log.domain";
import AppError from "@/utils/AppError";
import { redisClient } from "@/utils/redis-client";
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
    await redisClient.del(`logs:${userId}:${metricId}`);
    await redisClient.del(`logStats:${userId}:${metricId}`);
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
export const getAllLogsByMetricService = async ({
  userId,
  metricId,
  options,
}: {
  userId: string;
  metricId: string;
  options?: LogQueryOptions;
}): Promise<MetricLogDomain[]> => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  // Processing the Query
  const whereClause: any = { metricId };

  // filtering by date range
  if (options?.startDate || options?.endDate) {
    whereClause.loggedAt = {};
    if (options.startDate)
      whereClause.loggedAt[Op.gte] = new Date(options.startDate);
    if (options.endDate)
      whereClause.loggedAt[Op.lte] = new Date(options.endDate);
  }

  const orderClause: Order = [
    [
      options?.sortBy || "loggedAt",
      options?.order?.toUpperCase() === "ASC" ? "ASC" : "DESC",
    ],
  ];

  const logs = await MetricLog.findAll({
    where: whereClause,
    order: orderClause,
  });

  return toDomainMetricLogs(logs);
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
    await redisClient.del(
      `log:${updatedLog.metric.userId}:${updatedLog.metric.id}:${updatedLog.id}`
    );
    await redisClient.del(
      `logs:${updatedLog.metric.userId}:${updatedLog.metric.id}`
    );
    await redisClient.del(
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
    await redisClient.del(
      `log:${log.metric.userId}:${log.metric.id}:${log.id}`
    );
    await redisClient.del(`logs:${log.metric.userId}:${log.metric.id}`);
    await redisClient.del(`logStats:${log.metric.userId}:${log.metric.id}`);
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
