// src/features/metric-category/infrastructure/http/schema.zod.ts

import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { MetricCategoryDomain } from "@/features/metric-category/domain/entities/domain";
import { MetricCategoryResponseDTO } from "@/features/metric-category/infrastructure/http/dto";

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainMetricCategory = (
  metricCategory: MetricCategory & { metricCount?: number }
): MetricCategoryDomain => ({
  id: metricCategory.id,
  name: metricCategory.name,
  color: metricCategory.color,
  icon: metricCategory.icon,
  createdAt: metricCategory.createdAt!,
  updatedAt: metricCategory.updatedAt!,
  deletedAt: metricCategory.deletedAt,
  metricCount: Number(metricCategory.metricCount) ?? 0,
});

/**
 * * Sequelize[] → Domain[] Mapper
 */
// Dev Note Update: ADDED
export const toDomainMetricCategories = (
  logs: MetricCategory[]
): MetricCategoryDomain[] => logs.map(toDomainMetricCategory);

/**
 * * Mapper: Domain → DTO (for responses)
 */
export const toMetricCategoryResponseDTO = (
  metricCategory: MetricCategoryDomain
): MetricCategoryResponseDTO => ({
  id: metricCategory.id,
  name: metricCategory.name,
  color: metricCategory.color,
  icon: metricCategory.icon,
  createdAt: metricCategory.createdAt.toISOString(),
  updatedAt: metricCategory.updatedAt.toISOString(),
  metricCount: metricCategory.metricCount,
});

export const toMetricCategoryListResponseDTO = (
  metricCategories: MetricCategoryDomain[]
): MetricCategoryResponseDTO[] => {
  return metricCategories.map(toMetricCategoryResponseDTO);
};
