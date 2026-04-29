import { MetricLog } from "../../../domain/entities/MetricLog.js";

export type MetricLogRow = {
  id: string;
  metricId: string;
  logValue: number;
  type: "manual" | "automatic";
  loggedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

export function toDomain(row: MetricLogRow): MetricLog {
  return MetricLog.fromProps({
    id: row.id,
    metricId: row.metricId,
    logValue: row.logValue,
    type: row.type,
    loggedAt: row.loggedAt,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  });
}
