// src/types/metric-category.types.ts

export interface MetricCategoryBase {
  name: string;
  color: string;
  icon: string;
  deletedAt?: Date | null;
}
