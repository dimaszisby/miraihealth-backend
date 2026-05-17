export type MetricLogStatsCriteria = {
  organizationId: string;
  metricId?: string;
  userId?: string;
};

export type MetricLogStats = {
  average: number;
  min: number;
  max: number;
};

export interface MetricLogStatsPort {
  computeStats(criteria: MetricLogStatsCriteria): Promise<MetricLogStats>;
}
