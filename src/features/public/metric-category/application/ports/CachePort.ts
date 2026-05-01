export interface CachePort {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSec: number): Promise<void>;
  delByPattern(pattern: string): Promise<void>;
  isEnabled(): boolean;
}
