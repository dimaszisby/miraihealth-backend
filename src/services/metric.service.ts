// src/services/metric-service.ts

import db from "@/models/index";
import {
  MetricDomain,
  MetricDomainExtended,
  MetricLibraryDomain,
  MetricLibraryListDomain,
} from "@/types/domain/metric.domain";
import {
  CreateMetricRequestDTO,
  UpdateMetricRequestDTO,
} from "@/types/dtos/metric.dto";
import AppError from "@/utils/AppError";
import { redisClient, invalidateCache } from "@/utils/redis-client";
import { findOwnedMetric, validateMetricAccess } from "@/utils/db-helper";
import logger from "@/utils/logger";
import {
  toDomainMetric,
  toExtendedMetricDomain,
} from "@/utils/mappers/metric.mapper";
import { Op, fn, col, literal, Sequelize } from "sequelize";

const { Metric, MetricLog, MetricSettings, MetricCategory } = db;

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
  const existingMetric = await Metric.findOne({
    where: { userId, name: data.name },
  });
  if (existingMetric) {
    throw new AppError("Metric already exists", 400);
  }

  // If categoryId is provided, verify that the category exists for the user
  if (data.categoryId) {
    const category = await MetricCategory.findOne({
      where: { id: data.categoryId, userId },
    });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
  }

  // Create the metric
  const metric = await Metric.create({ userId, ...data });

  // Invalidate only the metrics list cache (not individual metric cache)
  if (redisClient.isOpen) {
    await invalidateCache(`metrics:${userId}`);
    logger.info(`♻️ Cache invalidated for metrics:${userId}`);
  }

  return metric;
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
  metric: typeof Metric & { logCount?: number } // 👈 add optional prop for TS
): MetricLibraryDomain | null => {
  if (!metric) return null;

  // we only call toJSON **once**
  const {
    MetricCategory: category,
    MetricSettings,
    logCount, // ⬅ already present
    ...metricData
  } = metric.toJSON() as any; // cast is fine at the edge

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
    goalType: MetricSettings?.goalType ?? undefined,
    logCount: logCount ?? 0, // default 0 for metrics without logs
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
      model: MetricSettings,
      as: "MetricSettings",
      attributes: ["goalType"],
    },
  ];

  if (include === "category") {
    includeOptions.unshift({
      model: MetricCategory,
      as: "MetricCategory",
      attributes: ["id", "name", "icon", "color"],
    });
  }

  return Metric.findAll({
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
  const total = await Metric.count({ where: whereClause });

  const transformed: MetricLibraryDomain[] = metrics
    .map(transformMetric)
    .filter(Boolean);

  return { metricsDomain: transformed, total };
};

/**
 * Fetch metric details including related category, settings, and logs.
 *
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
 */
export const getUserMetricDetailService = async (
  userId: string,
  metricId: string
): Promise<MetricDomainExtended | null> => {
  logger.info(
    `Fetching details for metricId: ${metricId} and userId: ${userId}`
  );

  // Fetch the whole data
  const metric = await Metric.findOne({
    where: { id: metricId, userId },
    include: [
      {
        model: MetricCategory,
        attributes: ["id", "name", "color", "icon"],
        as: "MetricCategory",
      },
      {
        model: MetricSettings,
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
        ],
        as: "MetricSettings",
      },
      {
        model: MetricLog,
        attributes: ["id", "logValue", "type", "createdAt"],
        order: [["createdAt", "DESC"]],
        as: "MetricLogs",
      },
    ],
  });
  if (!metric) {
    logger.info("No metric found.");
    return null;
  }

  // Authorization check if not public or don't owned by requesting user
  if (!metric.isPublic && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric details", 403);
  }

  return toExtendedMetricDomain(metric);
};

/**
 * Fetch specific metric owned by requesting/authenticated user
 *
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
 */
export const getUserMetricByIdService = async (
  userId: string,
  metricId: string
): Promise<MetricDomain> => {
  // Ensure the metric exists, check visibility, and  enforce ownership
  const metric = await findOwnedMetric(userId, metricId);

  console.info("Metric Domain on Service", metric);

  return toDomainMetric(metric);
};

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
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await findOwnedMetric(userId, metricId);

  // Update the metric
  await metric.update(data);

  // Re-fetch the metric to ensure data integerity
  await metric.reload();

  // Invalidate Redis cache
  try {
    if (redisClient.isOpen) {
      await invalidateCache(`metric:${metric.userId}:${metric.id}`);
      await invalidateCache(`metrics:${metric.userId}`);
      logger.info(
        `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`
      );
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

  await metric.destroy();
  logger.info(`Metric deleted successfully from database`);

  // Invalidate Redis cache
  try {
    if (redisClient.isOpen) {
      await invalidateCache(`metric:${metric.userId}:${metric.id}`);
      await invalidateCache(`metrics:${metric.userId}`);
      logger.info(
        `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`
      );
    }
  } catch (error: any) {
    logger.error(`Error invalidating cache: ${error.message}`, error);
  }

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
    const name = `Dummy Metric ${Date.now()}-${i}`;
    const description = `This is a dummy metric generated for testing pagination.`;
    const defaultUnit = ["kg", "steps", "ml", "units"][
      Math.floor(Math.random() * 4)
    ];
    const isPublic = Math.random() > 0.5;

    const metric = await Metric.create({
      userId,
      name,
      description,
      defaultUnit,
      isPublic,
    });
    dummyMetrics.push(toDomainMetric(metric));
  }

  if (redisClient.isOpen) {
    await invalidateCache(`metrics:${userId}`);
    logger.info(
      `♻️ Cache invalidated for metrics:${userId} after dummy generation`
    );
  }

  return dummyMetrics;
};
