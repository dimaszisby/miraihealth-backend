// src/utils/db-validators.ts

import db from "@/models/index";
import AppError from "./AppError.js";

const { Metric, MetricCategory, MetricSettings } = db;

/**
 * * Utility function to validate if a metric exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @throws {AppError} If metric does not exist
 */
export const validateMetricAccess = async (
  userId: string | null,
  metricId: string,
) => {
  // 1. Fetch the metric regardless of the userId.
  const metric = await Metric.findOne({
    where: { id: metricId },
    attributes: ["id", "userId", "isPublic"],
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }
  // 2. If the metric is not public and does not belong to the user, throw unauthorized.
  if (userId !== null && !metric.isPublic && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric stats", 403);
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
  categoryId: string,
) => {
  // 1. Fetch the metric category regardless of the userId.
  const metricCategory = await MetricCategory.findOne({
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

// TODO: Create Helper function to find a metric by ID
/**
 * * Metric
 * Helper function to find a metric owned by the user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @returns metric sequelize instance
 */
export const findOwnedMetric = async (
  userId: string,
  metricId: string,
): Promise<typeof Metric | null> => {
  await validateMetricAccess(userId, metricId);

  const metric = await Metric.findOne({
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
  categoryId: string,
): Promise<typeof MetricCategory | null> => {
  await validateMetricCategoryAccess(userId, categoryId);

  const category = await MetricCategory.findOne({
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
  metricId: string,
  settingsId: string,
): Promise<typeof MetricSettings | null> => {
  await validateMetricAccess(userId, metricId);

  const settings = await MetricSettings.findOne({
    where: { id: settingsId, metricId },
  });
  if (!settings) throw new AppError("Metric Settings not found", 404);

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
  metricId: string,
  logId: string,
): Promise<typeof db.MetricLog | null> => {
  await validateMetricAccess(userId, metricId);
  const log = await db.MetricLog.findOne({
    where: { id: logId, metricId },
  });
  if (!log) throw new AppError("Metric Log not found", 404);
  return log;
};
