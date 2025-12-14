export interface CacheInvalidationPort {
  invalidate(
    userId: string,
    metricId?: string,
    settingsId?: string
  ): Promise<void>;
}
