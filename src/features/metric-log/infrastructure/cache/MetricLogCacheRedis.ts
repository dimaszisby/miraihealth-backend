import {
  invalidateCache,
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client";
import logger from "@/utils/logger";
import { CachePort } from "../../application/ports/CachePort";
import type { VisualizationInvalidationPort } from "@/shared/application/ports/VisualizationInvalidationPort";
import { cursorCacheNamespace } from "@/shared/cache/keys";

const METRIC_LOG_CURSOR_NAMESPACE_ALL = cursorCacheNamespace(
  "metric-logs",
  "*"
);

export class MetricLogCacheRedis implements CachePort {
  constructor(
    private visualizationInvalidation: VisualizationInvalidationPort
  ) {}

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
    await invalidateCacheByPattern(
      `${METRIC_LOG_CURSOR_NAMESPACE_ALL}:${userId}:*fm:${metricId}*`
    );
    await invalidateCacheByPattern(
      `${METRIC_LOG_CURSOR_NAMESPACE_ALL}:${userId}:*`
    );

    await invalidateCache(`logStats:${userId}:${metricId}`);
    await invalidateCache(`logStats:${userId}`);

    await this.visualizationInvalidation.invalidateByMetric(userId, metricId);

    if (logId) {
      await invalidateCache(`log:${userId}:${logId}`);
    }
  }
}
