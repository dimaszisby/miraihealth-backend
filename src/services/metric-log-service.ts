// src/services/metric-log-service.ts
import { Op, Order } from "sequelize";
import { MetricLog } from "../models/metric-log.js";
import { Metric } from "../models/metric.js";
import AppError from "../utils/AppError.js";

export interface LogData {
  type?: "manual" | "automatic";
  logValue: number;
  loggedAt?: Date;
}

export interface LogQueryOptions {
  startDate?: Date;
  endDate?: Date;
  sortBy?: string;
  order?: "asc" | "desc";
}

/**
 * Create a new log for a given metric.
 */
export const createLog = async (metricId: string, logData: LogData) => {
  // Verify that the parent metric exists.
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) {
    throw new AppError("Parent Metric not found", 404);
  }

  // Ensure `loggedAt` is set (fallback to current timestamp)
  logData.loggedAt = logData.loggedAt ? new Date(logData.loggedAt) : new Date();

  // Prevent duplicate logs for the exact same timestamp
  const existingLog = await MetricLog.findOne({
    where: { metricId, loggedAt: logData.loggedAt },
  });
  if (existingLog) {
    throw new AppError("A log entry already exists for this timestamp", 400);
  }

  // Create and return the log
  return await MetricLog.create({
    metricId,
    type: logData.type || "manual",
    logValue: logData.logValue,
    loggedAt: logData.loggedAt,
  });
};

/**
 * Retrieve all logs for a given metric.
 * Supports optional filtering by a date range and sorting by logValue.
 */
export const getAllLogsByMetricService = async (
  metricId: string,
  options?: LogQueryOptions
) => {
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
 * Retrieve a specific log by its ID and parent metric ID.
 */
export const getLogByIdService = async (
  userId: string,
  metricId: string,
  id: string
) => {
  // Debugging
  console.log(`Checking ownership for user: ${userId}, metric: ${metricId}`);

  // Ensure parent metric exists
  const metric = await Metric.findOne({ where: { id: metricId, userId } });
  if (!metric) {
    console.error("🚨 Metric not found");
    throw new AppError("Metric not found", 404);
  }

  // 🚨 Restrict access if metric doesn't belong to the requesting user
  if (metric.userId !== userId) {
    console.error(
      "🚨 Unauthorized access: User attempted to view another user's log"
    );
    throw new AppError("Unauthorized access to logs", 403);
  }

  // Retrieve and return the log
  const log = await MetricLog.findOne({ where: { id, metricId } });
  if (!log) {
    throw new AppError("Log not found", 404);
  }

  return log;
};

/**
 * Update a log for a given metric.
 */
export const updateLogService = async (
  metricId: string,
  id: string,
  updateData: Partial<LogData>
) => {
  const log = await MetricLog.findOne({ where: { id, metricId } });
  if (!log) throw new AppError("Log not found", 404);

  if (updateData.loggedAt) {
    const existingLog = await MetricLog.findOne({
      where: { metricId, loggedAt: updateData.loggedAt },
    });
    if (existingLog)
      throw new AppError("A log already exists for this date", 400);
  }

  return await log.update(updateData);
};

/**
 * Delete a log for a given metric.
 */
export const deleteLogService = async (metricId: string, id: string) => {
  const log = await MetricLog.findOne({ where: { id, metricId } });
  if (!log) {
    throw new AppError("Log not found", 404);
  }
  await log.destroy();
};

/**
 * * Get Aggregated Stats for Logs
 */
export const getAggregatedStats = async (userId: string, metricId: string) => {
  // Ensure the metric ID is valid
  if (!metricId || typeof metricId !== "string")
    throw new AppError("Invalid metric ID", 400);

  console.log(`Fetching stats for metric: ${metricId}`);

  // 🔍 Ensure the metric exists and belongs to the user
  const metric = await Metric.findOne({ where: { id: metricId, userId } });
  if (!metric) {
    console.error("🚨 Metric not found for aggregation");
    throw new AppError("Metric not found", 404);
  }

  // Fetch logs for this metric
  const logs = await MetricLog.findAll({ where: { metricId } });
  if (logs.length === 0) {
    console.warn("⚠️ No logs found, returning default stats.");
    return { average: 0, min: 0, max: 0 };
  }

  const logValues = logs.map((log) => log.logValue);

  return {
    average: logValues.reduce((a, b) => a + b, 0) / logValues.length,
    min: Math.min(...logValues),
    max: Math.max(...logValues),
  };
};
