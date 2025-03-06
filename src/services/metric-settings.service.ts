// src/services/metric-settings-service.ts

import db from "../models/index.js";
import { redisClient } from "../utils/redis-client.js";
import { MetricSettingsBase } from "../types/metric-settings.types.js";
import { validateMetricAccess } from "../utils/db-validators.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

const { MetricSettings } = db;

/**
 * * Metric Settings Service
 * Handles all business logic related to metric settings.
 */

interface MetricSettingsParamsBase {
  userId: string;
  metricId: string;
  settingsId: string;
}

interface CreateSettingsParams {
  userId: string;
  metricId: string;
  settingData: MetricSettingsBase;
}

interface UpdateSettingsParams extends MetricSettingsParamsBase {
  updateData: Partial<MetricSettingsBase>;
}

interface UpdateDisplayOptionsParams extends MetricSettingsParamsBase {
  displayOptions: MetricSettingsBase["displayOptions"];
}

/**
 * Create metric settings for a specific metric
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param data - Metric settings data
 * @returns The created metric settings
 */
export const createMetricSettingsService = async ({
  userId,
  metricId,
  settingData,
}: CreateSettingsParams) => {
  // Ensure the parent metric exists and enforce ownership.
  const metric = await validateMetricAccess(userId, metricId);

  // Apply default values if optional fields are undefined
  const finalData = {
    ...settingData,
    alertEnabled: settingData.alertEnabled ?? false,
    alertThresholds: settingData.alertThresholds ?? 80,
    displayOptions: settingData.displayOptions ?? {
      showOnDashboard: true,
      priority: 1,
      chartType: "line",
      color: "#E897A3",
    },
    isAchieved: false,
    isActive: true,
    metricId,
  };

  // Create metric settings record
  let metricSettings = await MetricSettings.create(finalData);

  // Reload the record to include the associated Metric
  metricSettings = await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  // Invalidate cache for metric settings
  if (redisClient.isOpen && metricSettings.metric) {
    await redisClient.del(`metricSettings:${metric.userId}:${metric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }
  return metricSettings;
};

/**
 * Get all metric settings for a specific metric
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @returns Array of metric settings
 */
export const getAllMetricSettingsService = async (
  userId: string,
  metricId: string
) => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  const settings = await MetricSettings.findAll({ where: { metricId } });
  return settings || [];
};

/**
 * Get a specific metric setting by ID
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @returns Metric settings object
 * @throws {AppError} If settings not found
 */
export const getMetricSettingsByIdService = async ({
  userId,
  metricId,
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  // Ensure the metric settings exists
  const metricSettings = await MetricSettings.findOne({
    where: { id: settingsId, metricId: metricId },
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });
  if (!metricSettings) throw new AppError("Settings for Metric not found", 404);

  return metricSettings;
};

/**
 * Update a metric setting
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @param updates - Updated data
 * @returns Updated metric settings object
 */
export const updateMetricSettingsService = async ({
  userId,
  metricId,
  settingsId,
  updateData,
}: UpdateSettingsParams) => {
  // Ensure the metric settings exists
  const metricSettings = await getMetricSettingsByIdService({
    userId: userId,
    metricId: metricId,
    settingsId: settingsId,
  });

  await metricSettings.update(updateData);

  // Reload to ensure the association is present
  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await redisClient.del(
      `metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id}`
    );
    await redisClient.del(
      `metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return metricSettings;
};

/**
 * Delete metric settings
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param id - ID of the settings
 * @returns Deleted metric settings object
 */
export const deleteMetricSettingsService = async ({
  userId,
  metricId,
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the metric settings exists along with its associated Metric.
  const metricSettings = await getMetricSettingsByIdService({
    userId,
    metricId,
    settingsId,
  });

  // Store associated Metric info before deletion.
  const associatedMetric = metricSettings.metric;

  // Delete the metric settings record.
  await metricSettings.destroy();

  // Invalidate cache using stored associated Metric data.
  if (redisClient.isOpen && associatedMetric) {
    await redisClient.del(
      `metricSetting:${associatedMetric.userId}:${associatedMetric.id}:${metricSettings.id}`
    );
    await redisClient.del(
      `metricSettings:${associatedMetric.userId}:${associatedMetric.id}`
    );
    logger.info(
      `♻️ Cache invalidated for metricSetting:${associatedMetric.userId}:${associatedMetric.id}:${metricSettings.id} and metricSettings:${associatedMetric.userId}:${associatedMetric.id}`
    );
  }
  return metricSettings;
};

/**
 * Update goal achievement status property
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @returns Updated metric settings object
 */
export const updateGoalAchievementService = async ({
  userId,
  metricId,
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the metric settings exists
  const metricSettings = await getMetricSettingsByIdService({
    userId,
    metricId,
    settingsId,
  });

  await metricSettings.update({
    isAchieved: true,
  });

  // Reload to include associated Metric for cache invalidation
  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await redisClient.del(
      `metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id}`
    );
    await redisClient.del(
      `metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return metricSettings;
};

/**
 * Update display options for a metric setting
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @param displayOptions - Updated display options
 * @returns Updated metric settings object
 */
export const updateDisplayOptionsService = async ({
  userId,
  metricId,
  settingsId,
  displayOptions,
}: UpdateDisplayOptionsParams) => {
  // Ensure the metric settings exists
  const metricSettings = await getMetricSettingsByIdService({
    userId: userId,
    metricId: metricId,
    settingsId: settingsId,
  });

  // Overwrite the displayOptions field directly.
  metricSettings.setDataValue("displayOptions", displayOptions);
  await metricSettings.save();
  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "Metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await redisClient.del(
      `metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id}`
    );
    await redisClient.del(
      `metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return metricSettings.get({ plain: true });
};
