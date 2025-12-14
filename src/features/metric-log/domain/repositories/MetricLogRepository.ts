import { MetricLog } from "../entities/MetricLog";

export type CreateMetricLogDTO = {
  metricId: string;
  logValue: number;
  type: "manual" | "automatic";
  loggedAt: Date;
};

export interface MetricLogRepository {
  existsAtTimestamp(
    metricId: string,
    loggedAt: Date,
    excludeLogId?: string
  ): Promise<boolean>;
  create(data: CreateMetricLogDTO): Promise<MetricLog>;
  findById(userId: string, logId: string): Promise<MetricLog | null>;
  save(log: MetricLog): Promise<MetricLog>;
  delete(log: MetricLog): Promise<void>;
}
