import {
  invalidateCache,
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client.js";
import { CachePort } from "../../application/ports/CachePort.js";
import type { VisualizationInvalidationPort } from "@/shared/application/ports/VisualizationInvalidationPort.js";
import { cursorCacheNamespace } from "@/shared/cache/keys.js";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging.js";

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

    try {
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

      await this.visualizationInvalidation.invalidateByMetric(
        userId,
        metricId
      );

      if (logId) {
        await invalidateCache(`log:${userId}:${logId}`);
      }

      logCacheInvalidation("metric-log-cache", {
        userId,
        metricId,
        logId: logId ?? "-",
      });
    } catch (error) {
      logCacheInvalidationError("metric-log-cache", error, {
        userId,
        metricId,
        logId: logId ?? "-",
      });
      throw error;
    }
  }
}
