export interface MetricAccessPort {
  ensureMetricOwnership(
    userId: string,
    organizationId: string,
    metricId: string,
  ): Promise<void>;
}
