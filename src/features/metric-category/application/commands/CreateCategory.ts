// src/features/metric-category/application/commands/CreateCategory.ts

import AppError from "@/utils/AppError";
import { MetricCategoryDomain } from "../../domain/entities/domain";
import { CreateMetricCategoryRequestDTO } from "../../infrastructure/http/dto";
import { redisClient } from "@/utils/redis-client";
import { toDomainMetricCategory } from "../../infrastructure/mapping/mapper";
import { invalidateAllMetricCategoryCache } from "../../infrastructure/cache/cache";

import { models } from "@/models";

/**
 * Create metric category for user
 * @param userId - ID of the user
 * @param data - Metric category data
 * @returns The created metric category
 */
const createMetricCategoryService = async (
  userId: string,
  data: CreateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
  if (!userId) throw new AppError("User not authenticated", 403);

  // Check for duplicate category name for the same user:
  const existingCategory = await models.MetricCategory.findOne({
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

  const category = await models.MetricCategory.create(finalData);

  // Invalidate only the categories list cache (not individual category cache)
  if (redisClient.isOpen) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }

  return toDomainMetricCategory(category);
};

export default createMetricCategoryService;
