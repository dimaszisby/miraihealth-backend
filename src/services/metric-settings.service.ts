// src/services/metric-settings-service.ts

import db from "@/models/index";
import {
  CreateMetricSettingsRequestDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/types/dtos/metric-settings.dto";
import { MetricSettingsDomain } from "@/types/domain/metric-settings.domain";
import { UpdateMetricCategoryRequestDTO } from "@/types/dtos/metric-category.dto";
import { redisClient, invalidateCache } from "@/utils/redis-client";
import {
  findOwnedMetricSettings,
  validateMetricAccess,
} from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainDisplayOptions,
  toDomainMetricSettings,
} from "@/utils/mappers/metric-settings.mapper";

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

/**
 * Create metric settings for a specific metric
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param data - Metric settings data
 * @returns The created metric settings
 */
export const createMetricSettingsService = async (
  userId: string,
  metricId: string,
  settingData: CreateMetricSettingsRequestDTO
): Promise<MetricSettingsDomain> => {
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
    await invalidateCache(`metricSettings:${metric.userId}:${metric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }
  return toDomainMetricSettings(metricSettings);
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
): Promise<MetricSettingsDomain[]> => {
  // Ensure the parent metric exists and enforce ownership.
  await validateMetricAccess(userId, metricId);

  const settings = await MetricSettings.findAll({ where: { metricId } });
  return settings.map((setting: typeof MetricSettings) =>
    toDomainMetricSettings(setting)
  );
};

/**
 * Get a specific metric setting by ID
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @returns Metric settings object
 * @throws {AppError} If settings not found
 */
// TODO: Create a service to fetch sequelize model by ID
export const getMetricSettingsByIdService = async ({
  userId,
  metricId,
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    metricId,
    settingsId
  );

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
export const updateMetricSettingsService = async (
  userId: string,
  metricId: string,
  settingsId: string,
  updateData: Partial<UpdateMetricCategoryRequestDTO>
): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    metricId,
    settingsId
  );

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
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${metricSettings.id} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return toDomainMetricSettings(metricSettings);
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
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    metricId,
    settingsId
  );

  // Store associated Metric info before deletion.
  const associatedMetric = metricSettings.metric;

  // Delete the metric settings record.
  await metricSettings.destroy();

  // Invalidate cache using stored associated Metric data.
  if (redisClient.isOpen && associatedMetric) {
    await invalidateCache(`metricSetting:${associatedMetric.userId}:${associatedMetric.id}:${settingsId}`);
    await invalidateCache(`metricSettings:${associatedMetric.userId}:${associatedMetric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSetting:${associatedMetric.userId}:${associatedMetric.id}:${metricSettings.id} and metricSettings:${associatedMetric.userId}:${associatedMetric.id}`
    );
  }
  return toDomainMetricSettings(metricSettings);
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
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    metricId,
    settingsId
  );

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
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${settingsId}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${settingsId} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return toDomainMetricSettings(metricSettings);
};

/**
 * Partial Update only for display options for a metric setting
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @param settingsId - ID of the settings
 * @param displayOptions - Updated display options
 * @returns Updated metric settings object
 */
interface UpdateDisplayOptionsParams extends MetricSettingsParamsBase {
  displayOptions: UpdateMetricSettingsRequestDTO["displayOptions"];
}

export const updateDisplayOptionsService = async ({
  userId,
  metricId,
  settingsId,
  displayOptions,
}: UpdateDisplayOptionsParams): Promise<
  MetricSettingsDomain["displayOptions"]
> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    metricId,
    settingsId
  );

  await metricSettings.update({ displayOptions });

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
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${settingsId}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.metric.userId}:${metricSettings.metric.id}:${settingsId} and metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`
    );
  }

  return toDomainDisplayOptions(metricSettings);
};
