// src/services/metric-service.ts

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
import {
  redisClient,
  invalidateCache,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import { findOwnedMetric, validateMetricAccess } from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainMetric,
  toExtendedMetricDomain,
} from "@/utils/mappers/metric.mapper";
import { Op, fn, col, literal, Sequelize, Transaction } from "sequelize";
import { models } from "@/models"; // ✅ unified source of truth

/**
 * * Metric Service
 * Handles all business logic related to metric.
 */

/**
 * Create a new metric for a user.
 * This function checks for duplicate metric names and verifies that,
 * if a categoryId is provided, that category exists for the user.
 *
 * @param userId - ID of the user creating the metric.
 * @param data - Metric creation parameters.
 * @returns The created Metric instance.
 * @throws AppError if a duplicate exists or the category is not found.
 */
export const createMetricService = async (
  userId: string,
  data: CreateMetricRequestDTO
): Promise<MetricDomain> => {
  logger.info(`Create metric service triggered for user ${userId}`);
  // console.log("Create metric service triggered for user", userId);

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

  // Create the metric
  // const metric = await Metric.create({ userId, ...data });

  return db.sequelize.transaction(async (t: Transaction) => {
    // Create the metric
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

    // Invalidate only the metrics list cache (not individual metric cache)
    if (redisClient.isOpen) {
      // await invalidateCacheByPattern(`metrics:${userId}:*`);
      // logger.info(`♻️ Cache invalidated for metrics:${userId}:*`);

      invalidateAllMetricCache(userId);
    }

    logger.info(`=== [METRIC SERVICE - Library Fetch]`, metric);

    // Optionally: reload the metric with settings for immediate DTO return
    return metric;
  });
};

/**
 * Fetch all metrics for a user including category and settings.
 *
 * @param userId - ID of the user requesting the data
 * @returns Array of formatted metrics
 */
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
        // 👇 inline sub-query – runs once for the whole result set
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
 * Fetches all metrics for a user and transforms them into MetricLibraryListDomain format.
 *
 * @param userId - ID of the user.
 * @returns A promise that resolves to an array of transformed metrics.
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

  // Fetch paginated metrics
  const metrics = await fetchMetrics(userId, {
    offset,
    limit,
    sortBy,
    sortOrder,
    filters,
    include,
  });

  logger.info(
    `Fetched ${metrics.length} metrics for user ${userId} with pagination and filtering. Query Params: ${JSON.stringify(queryParams)}, Filters: ${JSON.stringify(filters)}, Metrics: ${JSON.stringify(metrics)}`
  );

  // Fetch total count for all metrics matching this user/filters
  const total = await models.Metric.count({ where: whereClause });

  const transformed: MetricLibraryDomain[] = metrics
    .map(transformMetric)
    .filter((m): m is MetricLibraryDomain => m !== null);

  return { metricsDomain: transformed, total };
};

// Development Note: This funciton is not currently used in the application.
// Development Note: This function is WAS deprecated due to API endpoint changes (from nested to flat structure), but will be reimplemented for metric details retrieval.
// TODO: Activate a new endpoint for this pipeline that functioned to get user's owned metrics details with it's related domain types (objects): metric-settings, metric-logs, etc.
/**
 * Fetch metric details including related category, settings, and logs.
 *
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
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
      limit: options.logsLimit || 20, // Default to 20 logs if not specified
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

// Developer Note: This function is WAS deprecated due to API endpoint changes (from flat to query params structure), but will be reimplemented for metric details retrieval.
// Proposal for future development: getPublicMetricId -> Public metrics retrieval that could be used for public templates or shared metrics.
// /**
//  * @deprecated This function is deprecated due to API endpoint changes from flat to query params structure.
//  * Fetch specific metric owned by requesting/authenticated user
//  *
//  * @param userId - ID of the user requesting the data
//  * @param metricId - ID of the metric to fetch
//  * @returns Metric detail object or null if not found
//  */
// export const getUserMetricByIdService = async (
//   userId: string,
//   metricId: string
// ): Promise<MetricDomain> => {
//   // Ensure the metric exists, check visibility, and  enforce ownership
//   const metric = await findOwnedMetric(userId, metricId);

//   logger.debug("Metric object before mapping:", metric);

//   return toDomainMetric(metric);
// };

// * NEW Service func
// Currently not being used
// Prepared for future development
// Public
// export const getPublicMetricByIdService = async (
// metricId: string,
// ): Promise<MetricDomain> => {
// try {
//   const publicMetric = await validateMetricAccess(null, metricId);
//   return toDomainMetric(publicMetric);
// } catch (error) {
//   throw error;
// }
// };

/**
 * Update metric metric service
 *
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @returns Updated metric  object
 */
export const updateMetricService = async (
  metricId: string,
  userId: string,
  data: UpdateMetricRequestDTO
): Promise<MetricDomain> => {
  // Checks: Existance, visibility, and ownership
  const metric = await findOwnedMetric(userId, metricId);

  // Update the metric
  await metric.update(data);

  // Re-fetch the metric to ensure data integerity
  await metric.reload();

  // Invalidate Redis cache
  try {
    if (redisClient.isOpen && metric.id) {
      invalidateAllMetricCache(userId, metric.id);
    }
  } catch (error: any) {
    logger.error(`Error invalidating cache: ${error.message}`, error);
  }

  return toDomainMetric(metric);
};

/**
 * Delete metric service
 *
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @returns Deleted metric  object
 */
export const deleteMetricService = async (
  userId: string,
  metricId: string
): Promise<MetricDomain> => {
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await findOwnedMetric(userId, metricId);

  // Invalidate Redis cache
  try {
    if (redisClient.isOpen && metric.id) {
      invalidateAllMetricCache(userId, metric.id);
    }
  } catch (error: any) {
    logger.error(`Error invalidating cache: ${error.message}`, error);
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
 * @param userId - ID of the user
 * @param count - Number of dummy metrics to generate
 * @returns Array of created metric objects
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
    await invalidateCacheByPattern(`metrics:${userId}:*`);
    logger.info(
      `♻️ Cache invalidated for metrics:${userId}:* after dummy generation`
    );
  }

  return dummyMetrics;
};

/**
 * Invalidates all cache keys related to a user's metrics,
 * including paginated, filtered, and stats keys.
 * @param userId - The user ID.
 * @param metricId -(optional) The Metric ID for per-metric cache keys. The metric ID.
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
      `♻️ [CACHE] cache invalidated user=${userId}, metric=${metricId ?? "-"}`
    );
  } catch (e: any) {
    logger.error(`Cache invalidation failed: ${e?.message}`, e);
  }
}
