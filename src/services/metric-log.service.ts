// src/services/metric-log.service.ts

import db from "../models/index.js";
import { Op, Order } from "sequelize";
import AppError from "../utils/AppError.js";
import { redisClient } from "../utils/redis-client.js";
import { validateMetricAccess } from "../utils/db-helper.js";
import { MetricLogBase } from "@/types/metric-log.types.js";
import logger from "../utils/logger.js";

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

interface CreateLogParams {
  userId: string;
  metricId: string;
  logData: MetricLogBase;
}

interface GetLogsParams {
  userId: string;
  metricId: string;
  options?: LogQueryOptions;
}

interface UpdateLogParams extends MetricLogBaseParams {
  updateData: Partial<MetricLogBase>;
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
}: CreateLogParams) => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  // Ensure `loggedAt` is set (fallback to current timestamp)
  logData.loggedAt = logData.loggedAt ? new Date(logData.loggedAt) : new Date();

  // Prevent duplicate logs for the exact same timestamp
  const existingLog = await MetricLog.findOne({
    where: { metricId, loggedAt: logData.loggedAt },
  });
  if (existingLog) {
    throw new AppError("A log entry already exists for this timestamp", 400);
  }

  const log = await MetricLog.create({
    metricId,
    type: logData.type || "manual",
    logValue: logData.logValue,
    loggedAt: logData.loggedAt,
  });

  // Invalidate logs list and aggregated stats cache for this metric
  if (redisClient.isOpen) {
    await redisClient.del(`logs:${userId}:${metricId}`);
    await redisClient.del(`logStats:${userId}:${metricId}`);
    logger.info(
      `♻️ Cache invalidated for logs and stats of metric:${metricId}`
    );
  }

  return log;
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
}: GetLogsParams) => {
  // Ensure the parent metric exists and enforce ownership.
  const metric = await validateMetricAccess(userId, metricId);

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

  return logs;
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
}: MetricLogBaseParams) => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

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

  return log;
};

/**
 * Update a log for a given metric.
 * @param metricId - ID of the metric
 * @param userId - ID of the user
 * @param id - ID of the specific log
 * @returns Updated metric log object
 */
export const updateLogService = async ({
  userId,
  metricId,
  logId,
  updateData,
}: UpdateLogParams) => {
  // Ensure Log Exists
  const log = await getLogByIdService({
    metricId: metricId,
    userId: userId,
    logId: logId,
  });

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

  return updatedLog;
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
}: MetricLogBaseParams) => {
  // Ensure Log Exists
  const log = await getLogByIdService({
    userId: userId,
    metricId: metricId,
    logId: logId,
  });

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
};

/**
 * * Get Aggregated Stats for Logs
 * @param metricId - ID of the metric
 * @param userId - ID of the user
 * @returns Numbers of average, min, max of aggregated stats
 */
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
