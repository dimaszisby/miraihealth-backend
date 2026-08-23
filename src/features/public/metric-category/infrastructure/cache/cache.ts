import { invalidateCacheByPattern } from "@/utils/redis-client.js";
import { METRIC_CATEGORY_CURSOR_NAMESPACE_ALL } from "../../application/cache.constants.js";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging.js";

/**
 * Invalidates all cache keys related to a user's category
 * including paginated, filtered, and sort
 * @param userId - The user ID.
 * @param organizationId - The active organization for the request.
 * @param metricId - The category ID.
 */
export async function invalidateAllMetricCategoryCache(
  userId: string,
  organizationId: string,
  categoryId?: string,
) {
  try {
    await invalidateCacheByPattern(
      `${METRIC_CATEGORY_CURSOR_NAMESPACE_ALL}:${userId}:org:${organizationId}:*`,
    );

    if (categoryId) {
      await invalidateCacheByPattern(
        `category:${organizationId}:${userId}:${categoryId}`,
      );
    }

    logCacheInvalidation("metric-category-cache", {
      userId,
      organizationId,
      categoryId: categoryId ?? "-",
    });
  } catch (error) {
    logCacheInvalidationError("metric-category-cache", error, {
      userId,
      organizationId,
      categoryId: categoryId ?? "-",
    });
    throw error;
  }
}
