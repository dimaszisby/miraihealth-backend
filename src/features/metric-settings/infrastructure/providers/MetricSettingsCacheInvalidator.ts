import {
  invalidateCache,
  invalidateCacheByPattern,
  redisClient,
} from "@/utils/redis-client";
import { CacheInvalidationPort } from "../../application/ports/CacheInvalidationPort";
import logger from "@/utils/logger";

export class MetricSettingsCacheInvalidator
  implements CacheInvalidationPort
{
  async invalidate(
    userId: string,
    metricId?: string,
    settingsId?: string
  ): Promise<void> {
    if (!redisClient.isOpen) return;

    logger.info(
      `[CACHE] Invalidating metric settings caches user=${userId} metric=${metricId ?? "-"} settings=${settingsId ?? "-"}`
    );

    await invalidateCache(`metricSettings:${userId}`);
    await invalidateCacheByPattern(`metricSettings:${userId}:*`);

    if (metricId) {
      await invalidateCache(`metricSettings:${userId}:${metricId}`);
    }

    if (settingsId) {
      await invalidateCache(`metricSetting:${userId}:${settingsId}`);
    }
  }
}
