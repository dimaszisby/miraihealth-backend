// src/services/metric-category.service.ts

import db from "../models/index.js";
import { redisClient } from "../utils/redis-client.js";
import { MetricCategoryBase } from "../types/metric-category.types.js";
import { validateMetricCategoryAccess } from "../utils/db-validators.js";
import AppError from "../utils/AppError.js";
import logger from "../utils/logger.js";

const { MetricCategory } = db;

/**
 * * Metric Category Service
 * Handles all business logic related to metric category.
 */

interface UpdateCategoryParams {
  userId: string;
  categoryId: string;
  updateData: Partial<MetricCategoryBase>;
}

/**
 * Create metric category for user
 * @param userId - ID of the user
 * @param data - Metric category data
 * @returns The created metric category
 */
export const createMetricCategoryService = async (
  userId: string,
  data: MetricCategoryBase
) => {
  if (!userId) throw new AppError("User not authenticated", 403);

  // Check for duplicate category name for the same user:
  const existingCategory = await MetricCategory.findOne({
    where: { userId: userId, name: data.name },
  });
  if (existingCategory) {
    throw new AppError("Category already exists", 400);
  }

  // Apply default values if optional fields are undefined
  const finalData = {
    ...data,
    color: data.color ?? "#E897A3",
    icon: data.icon ?? "📁",
    deletedAt: data.deletedAt || null,
    userId,
  };

  const category = await MetricCategory.create(finalData);

  // Invalidate only the categories list cache (not individual category cache)
  if (redisClient.isOpen) {
    await redisClient.del(`categories:${category.userId}`);
    logger.info(`♻️ Cache invalidated for categories:${category.userId}`);
  }

  return category;
};

/**
 * Get all metric category owned by user only can be accessed by owned user
 * @param userId - ID of the user
 * @returns Array of metric category
 */
export const getAllUserMetricCategoryService = async (userId: string) => {
  if (!userId) throw new AppError("User not authenticated", 403);

  const categories = await MetricCategory.findAll({ where: { userId } });
  return categories || [];
};

/**
 * Get a specific metric category by ID only can be accessed by owned user
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Metric category object
 * @throws {AppError}  If category not found or on failure
 */
export const getUserMetricCategoryByIdService = async (
  userId: string,
  categoryId: string
) => {
  // Ensure the metric category exists and enforce ownership.
  await validateMetricCategoryAccess(userId, categoryId);

  // Ensure the metric category exists
  const category = await MetricCategory.findOne({
    where: { id: categoryId, userId: userId },
  });
  if (!category) throw new AppError("Category not found", 404);

  return category;
};

/**
 * Update a metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @param updateData - Updated data
 * @returns Updated metric category object
 */
export const updateMetricCategoryService = async ({
  userId,
  categoryId,
  updateData,
}: UpdateCategoryParams) => {
  // Ensure the metric category exists and enforce ownership.
  const category = await getUserMetricCategoryByIdService(userId, categoryId);

  await category.update(updateData);

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`category:${category.userId}:${category.id}`); // Invalidate the single category cache
    await redisClient.del(`categories:${category.userId}`); // Invalidate the categories list cache
    logger.info(
      `♻️ Cache invalidated for category:${category.userId}:${category.id} and categories:${category.userId}`
    );
  }
  return category;
};

/**
 * Delete metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Deleted metric category object
 */
export const deleteMetricCategoryService = async (
  userId: string,
  categoryId: string
) => {
  // Ensure the metric category exists and enforce ownership.
  const category = await getUserMetricCategoryByIdService(userId, categoryId);

  await category.destroy();
  logger.info(`Metric category deleted successfully from database`);

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`category:${category.userId}:${category.id}`);
    await redisClient.del(`categories:${category.userId}`);
    logger.info(
      `♻️ Cache invalidated for category:${category.userId}:${category.id} and categories:${category.userId}`
    );
  }

  return category;
};
