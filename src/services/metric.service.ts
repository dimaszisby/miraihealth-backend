// src/services/metric-service.ts

import db from "../models/index.js";
import AppError from "../utils/AppError.js";
import { MetricBase } from "@/types/metric.types.js";
import { redisClient } from "../utils/redis-client.js";
import { validateMetricAccess } from "../utils/db-validators.js";
import logger from "../utils/logger.js";

const { Metric, MetricLog, MetricSettings, MetricCategory } = db;

/**
 * * Metric Service
 * Handles all business logic related to metric.
 */

// * Custom Return Data
export interface UserMetricDetailData extends MetricBase {
  id: string;
  category?: object;
  settings?: object;
  logs?: object[];
}

export interface MetricListData {
  id: string;
  name: string;
  category?: {
    id: string;
    name: string;
    icon: string;
    color: string;
  };
  goalType?: string;
}

// * Parameters
interface MetricParamsBase extends MetricBase {
  categoryId: string;
  originalMetricId: string;
}

interface UpdateMetricParams extends MetricBase {
  metricId: string;
  userId: string;
  categoryId?: string | null;
  originalMetricId?: string | null;
}

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
  data: MetricParamsBase
) => {
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
    await redisClient.del(`metrics:${userId}`);
    logger.info(`♻️ Cache invalidated for metrics:${userId}`);
  }

  return metric;
};

/**
 * Fetch all metrics for a user including category and settings.
 * @param userId - ID of the user requesting the data
 * @returns Array of formatted metrics
 */
export const getMetricsListService = async (
  userId: string
): Promise<MetricListData[]> => {
  // Verify that the models are loaded by logging their names.

  const metrics = await Metric.findAll({
    where: { userId },
    include: [
      {
        model: MetricCategory,
        as: "MetricCategory",
        attributes: ["id", "name", "icon", "color"],
      },
      {
        model: MetricSettings,
        as: "MetricSettings",
        attributes: ["goalType"],
      },
    ],
  });

  logger.info(`Fetched ${metrics.length} metrics for user ${userId}`);

  // Transform each metric: nest the category data under the property 'category'
  const transformed: MetricListData[] = metrics.map((metric: typeof Metric) => {
    const plainMetric = metric.toJSON();
    // Extract the category (if any) and remove it from the top level.
    const { MetricCategory, MetricSettings, ...rest } = plainMetric;
    return {
      ...rest,
      // Nest the category data if it exists.
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
  });

  return transformed;
};

/**
 * Fetch metric details including related category, settings, and logs.
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
 */
export const getUserMetricDetailService = async (
  userId: string,
  metricId: string
): Promise<UserMetricDetailData | null> => {
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

  return {
    id: metric.id,
    name: metric.name,
    description: metric.description || undefined,
    defaultUnit: metric.defaultUnit,
    isPublic: metric.isPublic,
    category: (metric as any).MetricCategory || undefined,
    settings: (metric as any).MetricSettings || undefined,
    logs: (metric as any).MetricLogs || undefined,
  };
};

/**
 * Fetch specific metric owned by requesting/authenticated user
 * @param userId - ID of the user requesting the data
 * @param metricId - ID of the metric to fetch
 * @returns Metric detail object or null if not found
 */
export const getUserMetricByIdService = async (
  userId: string,
  metricId: string
) => {
  // Ensure the metric exists, check visibility, and  enforce ownership
  const metric = await validateMetricAccess(userId, metricId);

  return metric;
};

// * NEW Service func
// Currently not being used
// Prepared for future development
// Public
export const getPublicMetricByIdService = async (metricId: string) => {
  const publicMetric = await Metric.findOne({
    where: { id: metricId, isPublic: true },
  });
  if (publicMetric) {
    throw new AppError("Metric not found", 404);
  }

  return publicMetric;
};

/**
 * Delete metric
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @returns Updated metric  object
 */
export const updateMetricService = async ({
  metricId,
  userId,
  categoryId,
  originalMetricId,
  name,
  description,
  defaultUnit,
  isPublic,
}: UpdateMetricParams) => {
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await getUserMetricByIdService(userId, metricId);

  // Update the metric
  await metric.update({
    categoryId,
    originalMetricId,
    name,
    description,
    defaultUnit,
    isPublic,
  });

  // Re-fetch the metric to ensure data integerity
  await metric.reload();

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`metric:${metric.userId}:${metric.id}`);
    await redisClient.del(`metrics:${metric.userId}`);
    logger.info(
      `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`
    );
  }

  return metric;
};

/**
 * Delete metric
 * @param userId - ID of the user
 * @param metricId - ID of the metric
 * @returns Deleted metric  object
 */
export const deleteMetricService = async (userId: string, metricId: string) => {
  // Ensure the metric exists, check visibility, and  enforce ownership.
  const metric = await getUserMetricByIdService(userId, metricId);

  await metric.destroy();
  logger.info(`Metric deleted successfully from database`);

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`metric:${metric.userId}:${metric.id}`);
    await redisClient.del(`metrics:${metric.userId}`);
    logger.info(
      `♻️ Cache invalidated for metric:${metric.userId}:${metric.id} and metrics:${metric.userId}`
    );
  }

  return metric;
};
