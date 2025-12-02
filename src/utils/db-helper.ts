// src/utils/db-validators.ts
// Not yet migrated to DDD

import AppError from "./AppError.js";
import { models } from "@/models";

import type { Metric } from "@/models/metric.model";
import type { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import type { MetricSettings } from "@/models/metric-settings.model";
import type { MetricLog } from "@/models/metric-log.model";

/**
 * * Utility function to validate if a metric exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @throws {AppError} If metric does not exist
 */
export const validateMetricAccess = async (
  userId: string,
  metricId: string
): Promise<Metric> => {
  if (!userId) {
    throw new AppError("User not authenticated", 401);
  }

  const metric = await models.Metric.findOne({
    where: { id: metricId },
    attributes: ["id", "userId"],
  });

  if (!metric) {
    throw new AppError("Metric not found", 404);
  }

  if (metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric", 403);
  }

  return metric;
};

/**
 * * Utility function to validate if a metric category exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param categoryId - The ID of the metric category
 * @throws {AppError} If metric does not exist
 */
export const validateMetricCategoryAccess = async (
  userId: string,
  categoryId: string
): Promise<MetricCategory> => {
  // 1. Fetch the metric category regardless of the userId.
  const metricCategory = await models.MetricCategory.findOne({
    where: { id: categoryId },
    attributes: ["id", "userId"],
  });
  if (!metricCategory) {
    throw new AppError("Metric Category not found", 404);
  }
  // 2. If the metric is does not belong to the user, throw unauthorized.
  if (metricCategory.userId !== userId) {
    throw new AppError("Unauthorized access to metric category", 403);
  }
  return metricCategory;
};

/**
 * * Helpers for finding owned entities
 * Includes: Metric, Category, Settings, and Log
 */

/**
 * * Metric
 * Helper function to find a metric owned by the user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @returns metric sequelize instance
 */
export const findOwnedMetric = async (
  userId: string,
  metricId: string
): Promise<Metric> => {
  // Overhaul: Stuck Here
  await validateMetricAccess(userId, metricId);

  const metric = await models.Metric.findOne({
    where: { id: metricId, userId },
  });
  if (!metric) throw new AppError("Metric not found", 404);

  return metric;
};

/**
 * * Metric Category
 * Helper function to find a metric category owned by the user
 * @param userId - The ID of the usr who owns the metric category
 * @param categoryId - The ID of the metric category
 * @returns category sequelize instance
 */
export const findOwnedCategory = async (
  userId: string,
  categoryId: string
): Promise<MetricCategory> => {
  await validateMetricCategoryAccess(userId, categoryId);

  const category = await models.MetricCategory.findOne({
    where: { id: categoryId, userId },
  });
  if (!category) throw new AppError("Category not found", 404);

  return category;
};

/**
 * * Metric Settings
 * Helper function to find a metric settings owned by the user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @param settingsId - the ID of the settings
 * @returns metric settings sequelize instance
 */
export const findOwnedMetricSettings = async (
  userId: string,
  settingsId: string
): Promise<MetricSettings> => {
  const settings = await models.MetricSettings.findOne({
    where: { id: settingsId },
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId", "isPublic"],
      },
    ],
  });
  if (!settings) throw new AppError("Metric Settings not found", 404);

  // Ensure the user has access to the associated metric
  const metric = settings.metric;
  if (metric && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric settings", 403);
  }

  return settings;
};

/**
 * * Metric Log
 * Helper function to find a metric log owned by the user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @param logId - the ID of the log
 * @returns metric log sequelize instance
 */
export const findOwnedMetricLog = async (
  userId: string,
  logId: string
): Promise<MetricLog> => {
  const log = await models.MetricLog.findOne({
    where: { id: logId },
    include: [
      {
        model: models.Metric,
        as: "metric",
        attributes: ["id", "userId", "isPublic"],
      },
    ],
  });
  if (!log) throw new AppError("Metric Log not found", 404);

  // Ensure the user has access to the associated metric
  const metric = log.metric;
  if (metric && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric log", 403);
  }
  return log;
};
