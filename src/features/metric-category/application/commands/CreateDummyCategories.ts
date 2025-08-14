import { MetricCategoryDomain } from "../../domain/entities/domain";
import db from "@/infrastructure/db/sequelize";
import AppError from "@/utils/AppError";
import { CreateMetricCategoryRequestDTO } from "../../infrastructure/http/dto";
import { redisClient } from "@/utils/redis-client";
import { toDomainMetricCategory } from "../../infrastructure/mapping/mapper";
import { invalidateAllMetricCategoryCache } from "../../infrastructure/cache/cache";
import logger from "@/utils/logger";

import { models } from "@/models";

/**
 * * Generate Dummy Metric Categories
 * Generates a specified number of dummy metric category entries for a given user.
 * @param userId - ID of the user
 * @param count - Number of dummy categories to generate
 * @returns Array of created metric category objects
 */
const generateDummyCategoriesService = async (
  userId: string,
  count: number
): Promise<MetricCategoryDomain[]> => {
  const dummyCategories: MetricCategoryDomain[] = [];
  const colors = ["#FF6347", "#FFD700", "#ADFF2F", "#6495ED", "#DA70D6"]; // Example colors
  const icons = ["📚", "💡", "💪", "🌱", "🌟"]; // Example icons

  for (let i = 0; i < count; i++) {
    const name = `Dummy Category ${Date.now()}-${i}`;
    const color = colors[Math.floor(Math.random() * colors.length)];
    const icon = icons[Math.floor(Math.random() * icons.length)];

    const category = await models.MetricCategory.create({
      userId,
      name,
      color,
      icon,
    });
    dummyCategories.push(toDomainMetricCategory(category));
  }

  if (redisClient.isOpen) {
    await invalidateAllMetricCategoryCache(userId);

    logger.info(
      `♻️ Cache invalidated for categories:${userId} after dummy generation`
    );
  }

  return dummyCategories;
};

export default generateDummyCategoriesService;
