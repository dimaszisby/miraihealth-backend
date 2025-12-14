import { invalidateCacheByPattern } from "@/utils/redis-client";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "@/features/metric-category/application/cache.constants";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging";

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
  try {
    await invalidateCacheByPattern(
      `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:*`
    );

    if (categoryId) {
      await invalidateCacheByPattern(`category:${userId}:${categoryId}`);
    }

    logCacheInvalidation("metric-category-cache", {
      userId,
      categoryId: categoryId ?? "-",
    });
  } catch (error) {
    logCacheInvalidationError("metric-category-cache", error, {
      userId,
      categoryId: categoryId ?? "-",
    });
    throw error;
  }
}
