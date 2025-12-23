import {
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client.js";
import { CachePort } from "../../application/ports/CachePort.js";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging.js";

export class MetricCacheRedis implements CachePort {
  isEnabled(): boolean {
    return redisClient.isOpen;
  }

  async invalidateMetrics(userId: string, metricId?: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await invalidateCacheByPattern(`metrics:${userId}:*`);
      if (metricId) {
        await invalidateCacheByPattern(`metric:${userId}:${metricId}:*`);
      }
      logCacheInvalidation("metric-cache", {
        userId,
        metricId: metricId ?? "-",
      });
    } catch (error) {
      logCacheInvalidationError(
        "metric-cache",
        error,
        {
          userId,
          metricId: metricId ?? "-",
        }
      );
    }
  }
}
