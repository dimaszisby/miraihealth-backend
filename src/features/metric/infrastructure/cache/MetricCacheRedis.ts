import logger from "@/utils/logger";
import {
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client";
import { CachePort } from "../../application/ports/CachePort";

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
      logger.info(
        `[CACHE] cache invalidated user=${userId}, metric=${metricId ?? "-"}`
      );
    } catch (error: any) {
      logger.error(
        `[CACHE ERROR] Cache invalidation failed: ${error?.message}`,
        error
      );
    }
  }
}
