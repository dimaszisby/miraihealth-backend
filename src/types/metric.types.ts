// src/types/metric.types.ts

export interface MetricBase {
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
  deletedAt?: Date | null;
}
