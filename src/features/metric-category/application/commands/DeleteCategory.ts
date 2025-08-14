import { findOwnedCategory } from "@/utils/db-helper";
import { MetricCategoryDomain } from "../../domain/entities/domain";
import { invalidateAllMetricCategoryCache } from "../../infrastructure/cache/cache";
import { redisClient } from "@/utils/redis-client";
import { toDomainMetricCategory } from "../../infrastructure/mapping/mapper";

/**
 * Delete metric category
 * @param userId - ID of the user
 * @param categoryId - ID of the category
 * @returns Deleted metric category object
 */
const deleteMetricCategoryService = async (
  userId: string,
  categoryId: string
): Promise<MetricCategoryDomain> => {
  const category = await findOwnedCategory(userId, categoryId);

  if (redisClient.isOpen && category.id) {
    invalidateAllMetricCategoryCache(userId, category.id);
  }
  await category.destroy();

  return toDomainMetricCategory(category);
};

export default deleteMetricCategoryService;