import logger from "@/utils/logger";
import { invalidateCacheByPattern } from "@/utils/redis-client";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants";

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
  logger.info(
    `♻️ [CACHE] Invalidating category for user=${userId}, category=${categoryId ?? "-"}`
  );

  // Invalidate "all category" list (user dashboard or similar)
  await invalidateCacheByPattern(`${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`);

  if (categoryId) {
    // Invalidate all metric list queries for this category
    await invalidateCacheByPattern(`category:${userId}:${categoryId}`);
  }

  logger.info(
    `♻️ [CACHE] Cache invalidated for user:${userId}, and categor:${categoryId ?? "-"}`
  );
}
