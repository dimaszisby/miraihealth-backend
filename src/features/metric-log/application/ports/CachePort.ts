export interface CachePort {
  isEnabled(): boolean;
  invalidate(userId: string, metricId: string, logId?: string): Promise<void>;
}
