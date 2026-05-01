export interface CachePort {
  isEnabled(): boolean;
  invalidateMetrics(userId: string, metricId?: string): Promise<void>;
}
