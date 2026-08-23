import {
  invalidateCache,
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client.js";
import { CacheInvalidationPort } from "../../application/ports/CacheInvalidationPort.js";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging.js";

export class MetricSettingsCacheInvalidator implements CacheInvalidationPort {
  async invalidate(
    userId: string,
    organizationId: string,
    metricId?: string,
    settingsId?: string,
  ): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await invalidateCacheByPattern(
        `metricSettings:${organizationId}:${userId}:*`,
      );

      if (metricId) {
        await invalidateCache(
          `metricSettings:${organizationId}:${userId}:${metricId}`,
        );
      }

      if (settingsId) {
        await invalidateCache(
          `metricSetting:${organizationId}:${userId}:${settingsId}`,
        );
      }

      logCacheInvalidation("metric-settings-cache", {
        userId,
        organizationId,
        metricId: metricId ?? "-",
        settingsId: settingsId ?? "-",
      });
    } catch (error) {
      logCacheInvalidationError("metric-settings-cache", error, {
        userId,
        organizationId,
        metricId: metricId ?? "-",
        settingsId: settingsId ?? "-",
      });
      throw error;
    }
  }
}
