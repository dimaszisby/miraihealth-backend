// src/types/metric.types.ts

// Note: This type is used for the Metric model in Sequelize.
export interface MetricBase {
  name: string;
  description?: string | null;
  defaultUnit: string;
  isPublic: boolean;
  deletedAt?: Date | null;
}
