import type { CachePort as SharedCachePort } from "@/shared/application/ports/CachePort.js";

export interface CachePort extends SharedCachePort<unknown> {
  isEnabled(): boolean;
  delByPattern(pattern: string): Promise<void>;
}
