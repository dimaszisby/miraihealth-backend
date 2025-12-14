import {
  invalidateCache,
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client";
import logger from "@/utils/logger";
import { CachePort } from "../../application/ports/CachePort";
import { invalidateVizByMetric } from "@/features/analytics/infrastructure/cache/VisualizationCacheRedis";

export class MetricLogCacheRedis implements CachePort {
  isEnabled(): boolean {
    return redisClient.isOpen;
  }

  async invalidate(
    userId: string,
    metricId: string,
    logId?: string
  ): Promise<void> {
    if (!this.isEnabled()) return;

    logger.info(
      `[CACHE] Invalidating logs for user=${userId}, metric=${metricId}, log=${logId ?? "-"}`
    );

    await invalidateCacheByPattern(`logs:${userId}:${metricId}:*`);
    await invalidateCacheByPattern(`logs:${userId}:all:*`);
    await invalidateCacheByPattern(`logs-cursor:v*:${userId}:*fm:${metricId}*`);
    await invalidateCacheByPattern(`logs-cursor:v*:${userId}:*`);

    await invalidateCache(`logStats:${userId}:${metricId}`);
    await invalidateCache(`logStats:${userId}`);

    await invalidateVizByMetric(userId, metricId);

    if (logId) {
      await invalidateCache(`log:${userId}:${logId}`);
    }
  }
}
