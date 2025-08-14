

import { findOwnedCategory } from "@/utils/db-helper";
import { MetricCategoryDomain } from "../../domain/entities/domain";
import { UpdateMetricCategoryRequestDTO } from "../../infrastructure/http/dto";
import { invalidateAllMetricCategoryCache } from "../../infrastructure/cache/cache";
import { redisClient } from "@/utils/redis-client";
import { toDomainMetricCategory } from "../../infrastructure/mapping/mapper";

/**
 * Update a metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @param updateData - Updated data
 * @returns Updated metric category object
 */
const updateMetricCategoryService = async (
  userId: string,
  categoryId: string,
  updateData: UpdateMetricCategoryRequestDTO
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);
  await category.update(updateData);
  await category.reload();

  if (redisClient.isOpen && category.id) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }

  return toDomainMetricCategory(category);
};

export default updateMetricCategoryService;
