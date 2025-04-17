// src/services/metric-service.ts

import db from "@/models/index";
import {
  MetricDomain,
  MetricDomainExtended,
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
  data: CreateMetricRequestDTO,
): Promise<MetricDomain> => {
  logger.info(`Create metric service triggered for user ${userId}`);
  console.log("Create metric service triggered for user", userId);

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
const transformMetric = (metric: any): MetricLibraryListDomain => {
  const { MetricCategory, MetricSettings, ...metricData } = metric.toJSON();
  return {
    ...metricData,
    category: MetricCategory
      ? {
          id: MetricCategory.id,
          name: MetricCategory.name,
          icon: MetricCategory.icon,
          color: MetricCategory.color,
        }
      : undefined,
    goalType: MetricSettings?.goalType ?? undefined,
  };
};

/**
 * Fetches all metrics for a given user from the database.
 * Includes associated MetricCategory and MetricSettings data.
 *
 * @param userId - ID of the user.
 * @returns A promise that resolves to an array of metric data.
 */
const fetchMetrics = async (userId: string, options: any): Promise<any[]> => {
  const { offset, limit, sortBy, sortOrder, filters, include } = options;

  const whereClause: any = { userId };

  // Apply filters to the where clause
  Object.keys(filters).forEach((key) => {
    whereClause[key] = filters[key];
  });

  const includeOptions: any[] = [];

  if (include === 'category') {
    includeOptions.push({
      model: MetricCategory,
      as: "MetricCategory",
      attributes: ["id", "name", "icon", "color"],
    });
  }

  includeOptions.push({
    model: MetricSettings,
    as: "MetricSettings",
    attributes: ["goalType"],
  });

  return Metric.findAll({
    where: whereClause,
    include: includeOptions,
    order: [[sortBy, sortOrder]],
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
export const getMetricsListService = async (
  userId: string,
  queryParams: any,
): Promise<MetricLibraryListDomain[]> => {
  const { page = 1, limit = 10, sortBy = "createdAt", sortOrder = "DESC", include, ...filters } = queryParams;

  const offset = (page - 1) * limit;

  const metrics = await fetchMetrics(userId, { offset, limit, sortBy, sortOrder, filters, include });

  logger.info(`Fetched ${metrics.length} metrics for user ${userId} with pagination and filtering. Query Params: ${JSON.stringify(queryParams)}, Filters: ${JSON.stringify(filters)}, Metrics: ${JSON.stringify(metrics)}`);

  const transformed: MetricLibraryListDomain[] = metrics.map(transformMetric);

  return transformed;
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
  metricId: string,
): Promise<MetricDomainExtended | null> => {
  logger.info(
    `Fetching details for metricId: ${metricId} and userId: ${userId}`,
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
  metricId: string,
): Promise<MetricDomain> => {
  // Ensure the metric exists, check visibility, and  enforce ownership
  const metric = await validateMetricAccess(userId, metricId);

  console.info("Metric Domain on Service", metric);

  return metric;
};

// * NEW Service func
// Currently not being used
// Prepared for future development
// Public
export const getPublicMetricByIdService = async (
  metricId: string,
): Promise<MetricDomain> => {
  try {
    const publicMetric = await validateMetricAccess(null, metricId);
    return toDomainMetric(publicMetric);
  } catch (error) {
    throw error;
  }
};

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
  data: UpdateMetricRequestDTO,
): Promise<MetricDomain> => {
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await findOwnedMetric(userId, metricId);

  // Update the metric
  await metric.update(data);

  // Re-fetch the metric to ensure data integerity
  await metric.reload();

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await invalidateCache(`metric:${metric.userId}:${metric.id}`);
    await invalidateCache(`metrics:${metric.userId}`);
    logger.info(
      `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`,
    );
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
  metricId: string,
): Promise<MetricDomain> => {
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await findOwnedMetric(userId, metricId);

  await metric.destroy();
  logger.info(`Metric deleted successfully from database`);

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await invalidateCache(`metric:${metric.userId}:${metric.id}`);
    await invalidateCache(`metrics:${metric.userId}`);
    logger.info(
      `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`,
    );
  }

  return toDomainMetric(metric);
};
