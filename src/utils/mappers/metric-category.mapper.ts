// src/utils/mappers/metricCategory.mapper.ts

import { MetricCategory } from "@/models/metric-category.model";
import { MetricCategoryDomain } from "@/types/domain/metric-category.domain";
import { MetricCategoryResponseDTO } from "@/types/dtos/metric-category.dto";

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainMetricCategory = (
  metricCategory: MetricCategory,
): MetricCategoryDomain => ({
  id: metricCategory.id,
  name: metricCategory.name,
  color: metricCategory.color,
  icon: metricCategory.icon,
  createdAt: metricCategory.createdAt!,
  updatedAt: metricCategory.updatedAt!,
  deletedAt: metricCategory.deletedAt ?? null,
});

/**
 * * Mapper: Domain → DTO (for responses)
 */
export const toMetricCategoryResponseDTO = (
  metricCategory: MetricCategoryDomain,
): MetricCategoryResponseDTO => ({
  id: metricCategory.id,
  name: metricCategory.name,
  color: metricCategory.color,
  icon: metricCategory.icon,
  createdAt: metricCategory.createdAt.toISOString(),
  updatedAt: metricCategory.updatedAt.toISOString(),
});
