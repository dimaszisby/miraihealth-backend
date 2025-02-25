// src/services/metric-settings-service.ts

import db from "../models/index.js";
import { redisClient } from "../utils/redis-client.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

const { Metric, MetricSettings } = db;

/**
 * * Metric Settings Service
 * Handles all business logic related to metric settings.
 */

/**
 * Check if a metric exists
 * @param metricId - The ID of the metric
 * @throws {AppError} If metric does not exist
 */
export const validateMetricExists = async (
  metricId: string
): Promise<typeof Metric> => {
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) {
    logger.error(`Metric with id ${metricId} not found.`);
    throw new AppError("Metric not found", 404);
  }
  return metric;
};

/**
 * Create metric settings for a specific metric
 * @param metricId - ID of the metric
 * @param data - Metric settings data
 * @returns The created metric settings
 */
export const createMetricSettings = async (metricId: string, data: any) => {
  // Ensure the parent metric exists
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) throw new AppError("Metric not found", 404);

  // Apply default values if optional fields are undefined
  const finalData = {
    ...data,
    alertEnabled: data.alertEnabled ?? false,
    alertThresholds: data.alertThresholds ?? 80,
    displayOptions: data.displayOptions ?? {
      showOnDashboard: true,
      priority: 1,
      chartType: "line",
      color: "#E897A3",
    },
    isAchieved: false,
    isActive: true,
    metricId,
  };

  const metricSettings = await MetricSettings.create(finalData);

  // Invalidate cache for metric settings
  if (redisClient.isOpen) {
    await redisClient.del(`metricSettings:${metric.userId}:${metricId}`);
    console.info(
      `♻️ Cache invalidated for metric settings of metric:${metricId}`
    );
  }

  return metricSettings;
};

/**
 * Get all metric settings for a specific metric
 * @param metricId - ID of the metric
 * @returns Array of metric settings
 */
export const getAllMetricSettings = async (metricId: string) => {
  // Ensure the parent metric exists
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) throw new AppError("Metric not found", 404);

  const settings = await MetricSettings.findAll({ where: { metricId } });
  return settings || [];
};

/**
 * Get a specific metric setting by ID
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @returns Metric settings object
 * @throws {AppError} If settings not found
 */
export const getMetricSettingsById = async (metricId: string, id: string) => {
  // Ensure the parent metric exists
  const metric = await Metric.findOne({ where: { id: metricId } });
  if (!metric) throw new AppError("Metric not found", 404);

  const metricSettings = await MetricSettings.findOne({
    where: { id, metricId },
  });

  if (!metricSettings) throw new AppError("Settings for Metric not found", 404);

  return metricSettings;
};

/**
 * Update a metric setting
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @param updates - Updated data
 * @returns Updated metric settings object
 */
export const updateMetricSettings = async (
  metricId: string,
  id: string,
  updates: any
) => {
  const metricSettings = await getMetricSettingsById(metricId, id);

  await metricSettings.update(updates);

  // Invalidate cache if Redis is available
  if (redisClient.isOpen) {
    await redisClient.del(
      `metricSetting:${metricSettings.userId}:${metricId}:${id}`
    );
    await redisClient.del(
      `metricSettings:${metricSettings.userId}:${metricId}`
    );
  }

  return metricSettings;
};

/**
 * Delete metric settings
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @returns Deleted metric settings object
 */
export const deleteMetricSettings = async (metricId: string, id: string) => {
  const metricSettings = await getMetricSettingsById(metricId, id);

  await metricSettings.destroy();

  // Invalidate cache if Redis is available
  if (redisClient.isOpen) {
    await redisClient.del(
      `metricSetting:${metricSettings.userId}:${metricId}:${id}`
    );
    await redisClient.del(
      `metricSettings:${metricSettings.userId}:${metricId}`
    );
  }

  return metricSettings;
};

/**
 * Update goal achievement status
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @returns Updated metric settings object
 */
export const updateGoalAchievement = async (metricId: string, id: string) => {
  const metricSettings = await getMetricSettingsById(metricId, id);

  metricSettings.isAchieved = true;
  await metricSettings.save();

  return metricSettings;
};

/**
 * Update display options for a metric setting
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @param displayOptions - Updated display options
 * @returns Updated metric settings object
 */
export const updateDisplayOptions = async (
  metricId: string,
  id: string,
  displayOptions: any
) => {
  const metricSettings = await getMetricSettingsById(metricId, id);

  metricSettings.displayOptions = displayOptions;
  await metricSettings.save();

  return metricSettings;
};
