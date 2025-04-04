// src/types/domain/metricCategory.domain.ts

/**
 * * Metric Category Domain Model
 * Pure internal representation for business logic (independent of DB & API).
 */

export interface MetricCategoryDomain {
  id: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}
