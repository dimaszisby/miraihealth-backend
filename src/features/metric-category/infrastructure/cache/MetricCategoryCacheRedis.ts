import { CachePort } from "../../application/ports/CachePort";
import {
  redisClient,
  invalidateCacheByPattern,
} from "@/utils/redis-client";
import {
  logCacheInvalidation,
  logCacheInvalidationError,
} from "@/shared/cache/logging";

export class MetricCategoryCacheRedis implements CachePort {
  constructor(private defaultTtlSeconds = 300) {}

  isEnabled(): boolean {
    return redisClient.isOpen;
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.isEnabled()) return null;
    const value = await redisClient.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSec?: number): Promise<void> {
    if (!this.isEnabled()) return;
    await redisClient.setEx(
      key,
      ttlSec ?? this.defaultTtlSeconds,
      JSON.stringify(value)
    );
  }

  async delByPattern(pattern: string): Promise<void> {
    if (!this.isEnabled()) return;
    try {
      await invalidateCacheByPattern(pattern);
      logCacheInvalidation("metric-category-cache", { pattern });
    } catch (error) {
      logCacheInvalidationError("metric-category-cache", error, { pattern });
      throw error;
    }
  }
}
