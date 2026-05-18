import { redisClient, invalidateCacheByPattern } from "@/utils/redis-client.js";
import { CachePort } from "../../application/ports/CachePort.js";

export class RedisCacheAdapter implements CachePort {
  isEnabled() {
    return redisClient.isOpen;
  }
  async get<T>(key: string) {
    if (!this.isEnabled()) return null;
    const raw = await redisClient.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }
  async set<T>(key: string, value: T, ttlSec: number) {
    if (!this.isEnabled()) return;
    await redisClient.set(key, JSON.stringify(value), { EX: ttlSec });
  }
  async delete(key: string) {
    if (!this.isEnabled()) return;
    await redisClient.del(key);
  }

  async delByPattern(pattern: string) {
    if (!this.isEnabled()) return;
    await invalidateCacheByPattern(pattern);
  }
}
