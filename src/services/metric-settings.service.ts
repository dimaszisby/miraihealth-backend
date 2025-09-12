import AppError from "@/utils/AppError";
import {
  CreateMetricSettingsRequestDTO,
  UpdateMetricSettingsRequestDTO,
} from "@/types/dtos/metric-settings.dto";
import { MetricSettingsDomain } from "@/types/domain/metric-settings.domain";
import {
  redisClient,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import {
  findOwnedMetricSettings,
  validateMetricAccess,
} from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainDisplayOptions,
  toDomainMetricSettings,
} from "@/utils/mappers/metric-settings.mapper";

import { models } from "@/models";

interface MetricSettingsParamsBase {
  userId: string;
  settingsId: string;
}

/**
 * * CREATE
 * Create metric settings for a specific metric
 */
export const createMetricSettingsService = async (
  userId: string,
  settingData: CreateMetricSettingsRequestDTO
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
    await invalidateAllMetricSettingsCache(userId, metricId);
  }
  return toDomainMetricSettings(metricSettings);
};

/**
 * * GET all via Offset
 * Get all metric settings for a specific metric
 */
export const getAllMetricSettingsService = async (
  userId: string,
  metricId?: string // metricId is now optional for filtering
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
    toDomainMetricSettings(setting)
  );
};

/**
 * * GET by ID
 * Get a specific metric setting by ID
 */
// TODO: Create a service to fetch sequelize model by ID
export const getMetricSettingsByIdService = async ({
  userId,
  settingsId,
}: MetricSettingsParamsBase) => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(userId, settingsId);

  return toDomainMetricSettings(metricSettings);
};

/**
 * * UPDATE
 * Update a metric setting
 */
type Payload = {
  goalEnabled?: boolean;
  goalType?: "cumulative" | "incremental";
  goalValue?: number | null;
  timeFrameEnabled?: boolean;
  startDate?: string | null;
  deadlineDate?: string | null;
  alertEnabled?: boolean;
  alertThresholds?: number | null;
  displayOptions?: {
    showOnDashboard?: boolean | null;
    priority?: number | null;
    chartType?: string | null;
    color?: string | null;
  };
};

export const updateMetricSettingsService = async (
  userId: string,
  settingsId: string,
  p: Partial<UpdateMetricSettingsRequestDTO>
): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(userId, settingsId);

  // 1) normalize display options
  if (p.displayOptions) {
    p.displayOptions.showOnDashboard = Boolean(
      p.displayOptions.showOnDashboard
    );
  }

  // 2) invariants for goal
  if (p.goalEnabled === false) {
    p.goalType = null;
    p.goalValue = null;
  } else if (p.goalEnabled === true) {
    if (p.goalType == null || p.goalValue == null) {
      throw new AppError(
        "goalType and goalValue are required when goalEnabled is true",
        404
      );
    }
  }

  // 3) invariants for timeframe
  if (p.timeFrameEnabled === false) {
    p.startDate = null;
    p.deadlineDate = null;
  } else if (p.timeFrameEnabled === true) {
    if (!p.startDate || !p.deadlineDate || p.deadlineDate <= p.startDate) {
      throw new AppError(
        "Valid startDate and deadlineDate required when timeFrameEnabled is true", 404
      );
    }
  }

  // 4) invariants for alert
  if (p.alertEnabled === false) {
    p.alertThresholds = null;
  } else if (p.alertEnabled === true && p.alertThresholds == null) {
    throw new AppError(
      "alertThresholds is required when alertEnabled is true", 404
    );
  }

  // 5) persist
  await models.MetricSettings.update(
    {
      goalEnabled: p.goalEnabled,
      goalType: p.goalType,
      goalValue: p.goalValue,
      timeFrameEnabled: p.timeFrameEnabled,
      startDate: p.startDate,
      deadlineDate: p.deadlineDate,
      alertEnabled: p.alertEnabled,
      alertThresholds: p.alertThresholds,
      displayOptions: p.displayOptions, // JSONB
    },
    { where: { id: settingsId } } // Metric Models do not have userId, the relation only with Metric, should we de-normalize data?
  );

  // Reload to ensure the association is present
  await metricSettings.reload({
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateAllMetricSettingsCache(
      metricSettings.metric.userId,
      metricSettings.metric.id,
      metricSettings.id
    );
  }

  return toDomainMetricSettings(metricSettings);
};

/**
 * * DELETE
 * Delete metric settings
 */
export const deleteMetricSettingsService = async ({
  userId,
  settingsId,
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(userId, settingsId);

  // Store associated Metric info before deletion.
  const associatedMetric = metricSettings.metric;

  // Delete the metric settings record.
  await metricSettings.destroy();

  // Invalidate cache using stored associated Metric data.
  if (redisClient.isOpen && associatedMetric) {
    await invalidateAllMetricSettingsCache(
      associatedMetric.userId,
      associatedMetric.id,
      settingsId
    );
  }
  return toDomainMetricSettings(metricSettings);
};

/**
 * * PATCH
 * Update goal achievement status property
 */
export const updateGoalAchievementService = async ({
  userId,
  settingsId,
}: MetricSettingsParamsBase): Promise<MetricSettingsDomain> => {
  // Ensure the metric settings exists and owned by the requesting user
  const metricSettings = await findOwnedMetricSettings(userId, settingsId);

  await metricSettings.update({
    isAchieved: true,
  });

  // Reload to include associated Metric for cache invalidation
  await metricSettings.reload({
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateAllMetricSettingsCache(
      metricSettings.metric.userId,
      metricSettings.metric.id,
      settingsId
    );
  }

  return toDomainMetricSettings(metricSettings);
};

/**
 * * PATCH
 * Partial Update only for display options for a metric setting
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
  const metricSettings = await findOwnedMetricSettings(userId, settingsId);

  await metricSettings.update({ displayOptions });

  await metricSettings.reload({
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId"],
      },
    ],
  });

  if (redisClient.isOpen && metricSettings.metric) {
    await invalidateAllMetricSettingsCache(
      metricSettings.metric.userId,
      metricSettings.metric.id,
      settingsId
    );
  }

  return toDomainDisplayOptions(metricSettings);
};

// * Helpers
/**
 * Invalidates all cache keys related to a user's metric settings for a specific metric,
 * including general lists and specific setting details.
 */
export async function invalidateAllMetricSettingsCache(
  userId: string,
  metricId?: string,
  settingsId?: string
) {
  logger.info(
    `[CACHE] Invalidating metric settings for user=${userId}, metric=${metricId ?? "-"}, settings=${settingsId ?? "-"}`
  );

  // Invalidate general settings list for the user
  await invalidateCache(`metricSettings:${userId}`);
  await invalidateCacheByPattern(`metricSettings:${userId}:*`);

  // Invalidate settings list for a specific metric if metricId is provided
  if (metricId) {
    await invalidateCache(`metricSettings:${userId}:${metricId}`);
  }

  // Invalidate specific metric setting if settingsId is provided
  if (settingsId) {
    await invalidateCache(`metricSetting:${userId}:${settingsId}`);
  }

  logger.info(
    `[CACHE] Cache invalidated for metric settings of user:${userId}, metric:${metricId ?? "-"} and settings:${settingsId ?? "-"}`
  );
}
