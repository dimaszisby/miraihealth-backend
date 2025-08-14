// src/features/metric-category/infrastructure/cache/cache.ts

import logger from "@/utils/logger";
import { invalidateCacheByPattern } from "@/utils/redis-client";

/**
 * Invalidates all cache keys related to a user's category
 * including paginated, filtered, and sort
 * @param userId - The user ID.
 * @param metricId - The category ID.
 */
export async function invalidateAllMetricCategoryCache(
  userId: string,
  categoryId?: string
) {
  console.log(
    `♻️ [CACHE] Invalidating category for user=${userId}, category=${categoryId ?? "-"}"}`
  );

  // Invalidate "all category" list (user dashboard or similar)
  await invalidateCacheByPattern(`categories:${userId}:*`);

  if (categoryId) {
    // Invalidate all metric list queries for this category
    await invalidateCacheByPattern(`category:${userId}:${categoryId}`);
  }

  logger.info(
    `♻️ [CACHE] Cache invalidated for user:${userId}, and categor:${categoryId ?? "-"}`
  );
}
