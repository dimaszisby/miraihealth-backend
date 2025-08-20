// src/services/metric-settings-service.ts

import db from "@/infrastructure/db/sequelize";
import AppError from "@/utils/AppError"; // Added missing import
import {
  CreateMetricSettingsRequestDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/types/dtos/metric-settings.dto";
import { MetricSettingsDomain } from "@/types/domain/metric-settings.domain";
import { UpdateMetricCategoryRequestDTO } from "@/features/metric-category/infrastructure/http/dto";
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

import { models } from "@/models"; // ✅ unified source of truth

/**
 * * Metric Settings Service
 * Handles all business logic related to metric settings.
 */

interface MetricSettingsParamsBase {
  userId: string;
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
  settingData: CreateMetricSettingsRequestDTO,
): Promise<MetricSettingsDomain> => {
  const { metricId } = settingData; // Extract metricId from settingData
  if (!metricId) throw new AppError("metricId is required", 400); // Should be caught by Zod, but good for type safety

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
  };

  // Create metric settings record
  let metricSettings = await models.MetricSettings.create(finalData);

  // Reload the record to include the associated Metric
  metricSettings = await metricSettings.reload({
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  // Invalidate cache for metric settings
  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateCache(`metricSettings:${userId}`); // Invalidate general settings list for the user
    await invalidateCache(`metricSettings:${userId}:${metricId}`); // Invalidate settings list for this specific metric
    logger.info(
      `♻️ Cache invalidated for metricSettings of user:${userId} and metric:${metricId}`,
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
  metricId?: string, // metricId is now optional for filtering
): Promise<MetricSettingsDomain[]> => {
  const whereClause: any = {};
  const queryOptions: any = { where: whereClause };

  // If metricId is provided, ensure the user has access to it.
  if (metricId) {
    await validateMetricAccess(userId, metricId);
    whereClause.metricId = metricId;
  } else {
    // If no metricId is provided, fetch all settings for metrics owned by the user
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

  const settings = await models.MetricSettings.findAll(queryOptions);
  return settings.map((setting: InstanceType<typeof models.MetricSettings>) =>
    toDomainMetricSettings(setting),
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
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    settingsId,
  );

  return toDomainMetricSettings(metricSettings);
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
  settingsId: string,
  updateData: Partial<UpdateMetricSettingsRequestDTO>,
): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    settingsId,
  );

  await metricSettings.update(updateData);

  // Reload to ensure the association is present
  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${metricSettings.id}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}`);
    // Invalidate specific metric settings if metricId was present
    if (metricSettings.metric.id) {
      await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    }
    logger.info(
      `♻️ Cache invalidated for metricSetting:${metricSettings.id}, and metricSettings of user:${metricSettings.metric.userId} and metric:${metricSettings.metric.id}`,
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
  settingsId,
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    settingsId,
  );

  // Store associated Metric info before deletion.
  const associatedMetric = metricSettings.metric;

  // Delete the metric settings record.
  await metricSettings.destroy();

  // Invalidate cache using stored associated Metric data.
  if (redisClient.isOpen && associatedMetric) {
    await invalidateCache(`metricSetting:${associatedMetric.userId}:${settingsId}`);
    await invalidateCache(`metricSettings:${associatedMetric.userId}`);
    // Invalidate specific metric settings if metricId was present
    if (associatedMetric.id) {
      await invalidateCache(`metricSettings:${associatedMetric.userId}:${associatedMetric.id}`);
    }
    logger.info(
      `♻️ Cache invalidated for metricSetting:${settingsId}, and metricSettings of user:${associatedMetric.userId} and metric:${associatedMetric.id}`,
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
  settingsId,
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    settingsId,
  );

  await metricSettings.update({
    isAchieved: true,
  });

  // Reload to include associated Metric for cache invalidation
  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${settingsId}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}`);
    // Invalidate specific metric settings if metricId was present
    if (metricSettings.metric.id) {
      await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    }
    logger.info(
      `♻️ Cache invalidated for metricSetting:${settingsId}, and metricSettings of user:${metricSettings.metric.userId} and metric:${metricSettings.metric.id}`,
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
  settingsId,
  displayOptions,
}: UpdateDisplayOptionsParams): Promise<
  MetricSettingsDomain["displayOptions"]
> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(
    userId,
    settingsId,
  );

  await metricSettings.update({ displayOptions });

  await metricSettings.reload({
    include: [
      {
        model: db.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateCache(`metricSetting:${metricSettings.metric.userId}:${settingsId}`);
    await invalidateCache(`metricSettings:${metricSettings.metric.userId}`);
    // Invalidate specific metric settings if metricId was present
    if (metricSettings.metric.id) {
      await invalidateCache(`metricSettings:${metricSettings.metric.userId}:${metricSettings.metric.id}`);
    }
    logger.info(
      `♻️ Cache invalidated for metricSetting:${settingsId}, and metricSettings of user:${metricSettings.metric.userId} and metric:${metricSettings.metric.id}`,
    );
  }

  return toDomainDisplayOptions(metricSettings);
};
