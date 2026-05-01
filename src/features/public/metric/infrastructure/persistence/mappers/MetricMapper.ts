import { Metric } from "../../../domain/entities/Metric.js";

export type MetricRow = {
  id: string;
  userId: string;
  categoryId: string | null;
  originalMetricId: string | null;
  name: string;
  description: string | null;
  defaultUnit: string;
  isPublic: boolean;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
};

export function toDomain(row: MetricRow): Metric {
  return Metric.fromProps({
    id: row.id,
    userId: row.userId,
    categoryId: row.categoryId,
    originalMetricId: row.originalMetricId,
    name: row.name,
    description: row.description,
    defaultUnit: row.defaultUnit,
    isPublic: row.isPublic,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt,
  });
}
