// src/types/domain/metric-log.domain.ts

export interface MetricLogDomain {
  id: string;
  metricId: string;
  type: "manual" | "automatic";
  logValue: number;
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}
