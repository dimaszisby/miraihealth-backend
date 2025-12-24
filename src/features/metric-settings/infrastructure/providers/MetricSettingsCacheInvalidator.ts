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
    metricId?: string,
    settingsId?: string,
  ): Promise<void> {
    if (!redisClient.isOpen) return;
    try {
      await invalidateCache(`metricSettings:${userId}`);
      await invalidateCacheByPattern(`metricSettings:${userId}:*`);

      if (metricId) {
        await invalidateCache(`metricSettings:${userId}:${metricId}`);
      }

      if (settingsId) {
        await invalidateCache(`metricSetting:${userId}:${settingsId}`);
      }

      logCacheInvalidation("metric-settings-cache", {
        userId,
        metricId: metricId ?? "-",
        settingsId: settingsId ?? "-",
      });
    } catch (error) {
      logCacheInvalidationError("metric-settings-cache", error, {
        userId,
        metricId: metricId ?? "-",
        settingsId: settingsId ?? "-",
      });
      throw error;
    }
  }
}
