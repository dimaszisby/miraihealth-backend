// src/services/metric-category.service.ts

import db from "../models/index.js";
import { MetricCategoryDomain } from "@/types/domain/metric-category.domain";
import {
  CreateMetricCategoryRequestDTO,
  UpdateMetricCategoryRequestDTO,
} from "@/types/dtos/metric-category.dto";
import AppError from "@/utils/AppError";
import logger from "@/utils/logger";
import { redisClient } from "@/utils/redis-client";
import { findOwnedCategory } from "@/utils/db-helper.js";
import { toDomainMetricCategory } from "@/utils/mappers/metric-category.mapper.js";

const { MetricCategory } = db;

/**
 * * Metric Category Service
 * Handles all business logic related to metric category.
 */

/**
 * Create metric category for user
 * @param userId - ID of the user
 * @param data - Metric category data
 * @returns The created metric category
 */
// Question: How to use CreateMetricCategoryRequestDTO instead of MetricCategoryBase?
export const createMetricCategoryService = async (
  userId: string,
  data: CreateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
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
    userId,
  };

  const category = await MetricCategory.create(finalData);

  // Invalidate only the categories list cache (not individual category cache)
  if (redisClient.isOpen) {
    await redisClient.del(`categories:${category.userId}`);
    logger.info(`♻️ Cache invalidated for categories:${category.userId}`);
  }

  return toDomainMetricCategory(category);
};

/**
 * Get all metric category owned by user only can be accessed by owned user
 * @param userId - ID of the user
 * @returns Array of metric category
 */
export const getAllUserMetricCategoryService = async (
  userId: string
): Promise<MetricCategoryDomain[]> => {
  if (!userId) throw new AppError("User not authenticated", 403);

  const redisKey = `categories:${userId}`;

  // Check Redis Cache if chache exists
  if (redisClient.isOpen) {
    const cached = await redisClient.get(redisKey);
    if (cached) {
      logger.debug(`✅ Categories fetched from cache for user: ${userId}`);
      return JSON.parse(cached);
    }
  }

  // If chache not exists, Fallback to DB
  const categories = await MetricCategory.findAll({ where: { userId } });

  const result = categories.map(toDomainMetricCategory);

  // Cache Result in Redis with TTL
  // Currently being set to 10 minutes (600 seconds)
  if (redisClient.isOpen) {
    await redisClient.setEx(redisKey, 600, JSON.stringify(result));
    logger.info(`📦 Categories cached for user: ${userId}`);
  }

  return result;
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
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);
  return toDomainMetricCategory(category);
};

/**
 * Update a metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @param updateData - Updated data
 * @returns Updated metric category object
 */
// Question: How to use UpdateMetricCategoryRequestDTO instead of UpdateCategoryParams? especially this requires userId and categoryId?
export const updateMetricCategoryService = async (
  userId: string,
  categoryId: string,
  updateData: UpdateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
  // Ensure the metric category exists and enforce ownership.
  const category = await findOwnedCategory(userId, categoryId);

  const updatedCategory = await category.update(updateData);

  // Invalidate Redis cache
  if (redisClient.isOpen) {
    await redisClient.del(`category:${category.userId}:${category.id}`); // Invalidate the single category cache
    await redisClient.del(`categories:${category.userId}`); // Invalidate the categories list cache
    logger.info(
      `♻️ Cache invalidated for category:${category.userId}:${category.id} and categories:${category.userId}`
    );
  }

  return toDomainMetricCategory(updatedCategory);
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
): Promise<MetricCategoryDomain> => {
  // Ensure the metric category exists and enforce ownership.
  const category = await findOwnedCategory(userId, categoryId);

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

  return toDomainMetricCategory(category);
};
