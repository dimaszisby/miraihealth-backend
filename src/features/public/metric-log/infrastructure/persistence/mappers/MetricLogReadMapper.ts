import { MetricLog } from "../models/metric-log.sequelize.js";
import { MetricLogDomain } from "@/types/domain/metric-log.domain.js";

export const toDomainMetricLog = (log: MetricLog): MetricLogDomain => ({
  id: log.id,
  metricId: log.metricId,
  type: log.type,
  logValue: log.logValue,
  loggedAt: new Date(log.loggedAt),
  createdAt: new Date(log.createdAt!),
  updatedAt: new Date(log.updatedAt!),
});

export const toDomainMetricLogs = (logs: MetricLog[]): MetricLogDomain[] =>
  logs.map(toDomainMetricLog);
