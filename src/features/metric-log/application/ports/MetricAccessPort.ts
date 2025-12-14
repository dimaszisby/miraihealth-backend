export interface MetricAccessPort {
  ensureMetricOwnership(userId: string, metricId: string): Promise<void>;
}
