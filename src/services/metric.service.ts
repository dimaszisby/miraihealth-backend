import db from "@/infrastructure/db/sequelize";
import {
  MetricDomain,
  MetricDomainExtended,
  MetricLibraryDomain,
} from "@/types/domain/metric.domain";
import {
  CreateMetricRequestDTO,
  UpdateMetricRequestDTO,
} from "@/types/dtos/metric.dto";
import AppError from "@/utils/AppError";
import { redisClient, invalidateCacheByPattern } from "@/utils/redis-client";
import { findOwnedMetric } from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainMetric,
  toExtendedMetricDomain,
} from "@/utils/mappers/metric.mapper";
import { literal, Transaction } from "sequelize";
import { models } from "@/models";

/**
 * * CREATE
 * Create a new metric for a user.
 * This function checks for duplicate metric names and verifies that, if a categoryId is provided, that category exists for the user.
 */
export const createMetricService = async (
  userId: string,
  data: CreateMetricRequestDTO
): Promise<MetricDomain> => {
  logger.info(`Create metric service triggered for user ${userId}`);

  // Check for duplicate metric name for the user
  const existingMetric = await models.Metric.findOne({
    where: { userId, name: data.name },
  });
  if (existingMetric) {
    throw new AppError("Metric already exists", 400);
  }

  // If categoryId is provided, verify that the category exists for the user
  if (data.categoryId) {
    const category = await models.MetricCategory.findOne({
      where: { id: data.categoryId, userId },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  return db.sequelize.transaction(async (t: Transaction) => {
    const metric = await models.Metric.create(
      { userId, ...data },
      { transaction: t }
    );

    // Eagerly create the default settings row
    await models.MetricSettings.create(
      {
        metricId: metric.id,
        // All default fields for your settings model:
        goalEnabled: false,
        goalType: null,
        goalValue: null,
        timeFrameEnabled: false,
        startDate: null,
        deadlineDate: null,
        alertEnabled: false,
        alertThresholds: 80,
        isAchieved: false,
        isActive: true,
        displayOptions: {
          showOnDashboard: true,
          priority: 1,
          chartType: "line",
          color: "#E897A3",
        },
      },
      { transaction: t }
    );

    if (redisClient.isOpen) {
      invalidateAllMetricCache(userId);
    }

    await metric.reload();

    return metric;
  });
};

/**
 * * GET ALL
 * Fetch all metrics for a user including category and settings.
 * @deprecated migrated to cursor-based pagination
 */
export const getUserMetricLibrariesService = async (
  userId: string,
  queryParams: any
): Promise<{ metricsDomain: MetricLibraryDomain[]; total: number }> => {
  const {
    page = 1,
    limit = 10,
    sortBy = "createdAt",
    sortOrder = "DESC",
    include,
    ...filters
  } = queryParams;

  const offset = (page - 1) * limit;
  const whereClause: any = { userId, ...filters };

  const metrics = await fetchMetrics(userId, {
    offset,
    limit,
    sortBy,
    sortOrder,
    filters,
    include,
  });

  const total = await models.Metric.count({ where: whereClause });

  const transformed: MetricLibraryDomain[] = metrics
    .map(transformMetric)
    .filter((m): m is MetricLibraryDomain => m !== null);

  return { metricsDomain: transformed, total };
};

/**
 * * GET DETAIL
 * Fetch metric details including related category, settings, and logs.
 */
export const getUserMetricDetailService = async (
  userId: string,
  metricId: string,
  options: { includes?: string[]; logsLimit?: number }
): Promise<MetricDomainExtended | null> => {
  logger.info(
    `Fetching details for metricId: ${metricId} and userId: ${userId}`
  );

  // Core where clause: only allow owned metric or public (if supporting public templates)
  const where = { id: metricId, userId };

  // Map includes to ORM eager-load
  const includeArr: any[] = [];

  if (options.includes?.includes("category")) {
    includeArr.push({
      model: models.MetricCategory,
      as: "category",
      attributes: ["id", "name", "color", "icon", "createdAt", "updatedAt"],
    });
  }

  if (options.includes?.includes("settings")) {
    includeArr.push({
      model: models.MetricSettings,
      as: "settings",
      attributes: [
        "id",
        "goalType",
        "goalValue",
        "startDate",
        "deadlineDate",
        "alertThresholds",
        "isAchieved",
        "isActive",
        "displayOptions",
        "createdAt",
        "updatedAt",
      ],
    });
  }

  if (options.includes?.includes("logs")) {
    includeArr.push({
      model: models.MetricLog,
      as: "logs",
      attributes: ["id", "logValue", "type", "loggedAt", "createdAt"],
      order: [["createdAt", "DESC"]],
      limit: options.logsLimit || 20, // Default
    });
  }

  // Fetch the metric
  const metric = await models.Metric.findOne({
    where,
    include: includeArr,
  });
  if (!metric) {
    logger.info("No metric found.");
    return null;
  }

  // Security: Authorization check if not public or don't owned by requesting user
  if (!metric.isPublic && metric.userId !== userId) {
    throw new AppError("Unauthorized", 403);
  }

  return toExtendedMetricDomain(metric);
};

/**
 * * UPDATE
 * Update metric metric service
 */
export const updateMetricService = async (
  metricId: string,
  userId: string,
  data: UpdateMetricRequestDTO
): Promise<MetricDomain> => {
  const metric = await findOwnedMetric(userId, metricId);

  await metric.update(data);

  await metric.reload();

  if (redisClient.isOpen && metric.id) {
    invalidateAllMetricCache(userId, metric.id);
  }

  return toDomainMetric(metric);
};

/**
 * * DELETE
 * Delete metric service
 */
export const deleteMetricService = async (
  userId: string,
  metricId: string
): Promise<MetricDomain> => {
  const metric = await findOwnedMetric(userId, metricId);

  if (redisClient.isOpen && metric.id) {
    invalidateAllMetricCache(userId, metric.id);
  }

  await metric.destroy();

  return toDomainMetric(metric);
};

/**
 * * ===== Services for Testing Purposes =====
 */

/**
 * * Generate Dummy Metrics
 * Generates a specified number of dummy metric entries for a given user.
 */
export const generateDummyMetricsService = async (
  userId: string,
  count: number
): Promise<MetricDomain[]> => {
  const dummyMetrics: MetricDomain[] = [];
  for (let i = 0; i < count; i++) {
    const metric = await models.Metric.create({
      userId,
      name: `Dummy Metric ${Date.now()}-${i}`,
      description: `This is a dummy metric generated for testing pagination.`,
      defaultUnit: ["kg", "steps", "ml", "units"][
        Math.floor(Math.random() * 4)
      ],
      isPublic: Math.random() > 0.5,
    });
    dummyMetrics.push(toDomainMetric(metric));
  }

  if (redisClient.isOpen) {
    invalidateAllMetricCache(userId);
  }

  return dummyMetrics;
};

//* Helpers
/**
 * Invalidates all cache keys related to a user's metrics,
 * including paginated, filtered, and stats keys.
 */
export async function invalidateAllMetricCache(
  userId: string,
  metricId?: string
) {
  try {
    // lists, with any query combo
    await invalidateCacheByPattern(`metrics:${userId}:*`);

    // details, any include/logsLimit combo
    if (metricId) {
      await invalidateCacheByPattern(`metric:${userId}:${metricId}:*`);
    }

    // optional: if you cache trends or aggregates
    // await invalidateCacheByPattern(`trends:${userId}:${metricId}:*`);

    logger.info(
      `[CACHE] cache invalidated user=${userId}, metric=${metricId ?? "-"}`
    );
  } catch (e: any) {
    logger.error(`[CACHE ERROR] Cache invalidation failed: ${e?.message}`, e);
  }
}

/**
 * Fetches all metrics for a given user from the database.
 * Includes associated MetricCategory and MetricSettings data.
 *
 * @param userId - ID of the user.
 * @returns A promise that resolves to an array of metric data.
 */
const fetchMetrics = async (userId: string, options: any) => {
  const { offset, limit, sortBy, sortOrder, filters, include } = options;

  const whereClause: any = { userId, ...filters };

  const includeOptions: any[] = [
    {
      model: models.MetricSettings,
      as: "settings",
      attributes: ["goalType"],
    },
  ];

  // Always include MetricCategory if it exists for the metric
  includeOptions.unshift({
    model: models.MetricCategory,
    as: "category",
    attributes: ["id", "name", "icon", "color"],
    required: false, // Use left join to include metrics without categories
  });

  return models.Metric.findAll({
    where: whereClause,
    attributes: {
      include: [
        [
          literal(`
            (
              SELECT COUNT(*)
              FROM metric_logs AS ml
              WHERE ml.metric_id = "Metric"."id"
            )
          `),
          "logCount",
        ],
      ],
    },
    include: includeOptions,
    order: [
      [sortBy, sortOrder],
      ["id", "ASC"],
    ],
    offset: Number(offset),
    limit: Number(limit),
  });
};

/**
 * Transforms a Metric instance to MetricLibraryListDomain, nesting the category data.
 * @param metric - Metric instance
 * @returns MetricLibraryListDomain
 */
const transformMetric = (
  metric: InstanceType<typeof models.Metric> & { logCount?: number } // 👈 add optional prop for TS
): MetricLibraryDomain => {
  // we only call toJSON **once**
  const { category, settings, logCount, ...metricData } =
    metric.toJSON() as any;

  return {
    ...metricData,
    category: category
      ? {
          id: category.id,
          name: category.name,
          icon: category.icon,
          color: category.color,
        }
      : undefined,
    goalType: settings?.goalType ?? null,
    logCount: logCount ?? 0,
  };
};
