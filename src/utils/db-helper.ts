// src/utils/db-validators.ts

import db from "../models/index.js";
import AppError from "./AppError.js";

const { Metric, MetricCategory } = db;

/**
 * * Utility function to validate if a metric exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param metricId - The ID of the metric
 * @throws {AppError} If metric does not exist
 */
export const validateMetricAccess = async (
  userId: string,
  metricId: string
) => {
  // First, fetch the metric regardless of the userId.
  const metric = await Metric.findOne({
    where: { id: metricId },
    attributes: ["id", "userId", "isPublic"],
  });
  if (!metric) {
    throw new AppError("Metric not found", 404);
  }
  // Then, if the metric is not public and does not belong to the user, throw unauthorized.
  if (!metric.isPublic && metric.userId !== userId) {
    throw new AppError("Unauthorized access to metric stats", 403);
  }
  return metric;
};

// TODO: Create helper func for FindOwnedMetric

/**
 * * Utility function to validate if a metric category exists and owned by the requesting user
 * @param userId - The ID of the user who owns the metric
 * @param categoryId - The ID of the metric category
 * @throws {AppError} If metric does not exist
 */
export const validateMetricCategoryAccess = async (
  userId: string,
  categoryId: string
) => {
  // First, fetch the metric regardless of the userId.
  const metricCategory = await MetricCategory.findOne({
    where: { id: categoryId },
    attributes: ["id", "userId"],
  });
  if (!metricCategory) {
    throw new AppError("Metric Category not found", 404);
  }
  // Then, if the metric is does not belong to the user, throw unauthorized.
  if (metricCategory.userId !== userId) {
    throw new AppError("Unauthorized access to metric category", 403);
  }
  return metricCategory;
};

/**
 * * Helper function to find a metric category owned by the user
 * @param userId - The ID of the usr who owns the metric category
 * @param categoryId - The ID of the metric category
 * @returns category sequelize instance
 */
export const findOwnedCategory = async (
  userId: string,
  categoryId: string
): Promise<typeof MetricCategory | null> => {
  await validateMetricCategoryAccess(userId, categoryId);

  const category = await MetricCategory.findOne({
    where: { id: categoryId, userId },
  });
  if (!category) throw new AppError("Category not found", 404);

  return category;
};
