// src/features/metric-category/infrastructure/http/schema.zod.ts

import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { MetricCategoryResponseDTO } from "@/features/metric-category/infrastructure/http/dto";
import { MetricCategoryDomain } from "./MetricCategoryLegacy.domain";

/** * * Mapper: Sequelize → Domain */ export const toDomainLegacy = (
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

/** * * Sequelize[] → Domain[] Mapper */
// Dev Note Update: ADDED
export const toListDomainLegacy = (
  logs: MetricCategory[]
): MetricCategoryDomain[] => logs.map(toDomainLegacy);

/** * * Mapper: Domain → DTO (for responses) */
export const toMResponseDTOLegacy = (
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

export const toListResponseDTOLegacy = (
  metricCategories: MetricCategoryDomain[]
): MetricCategoryResponseDTO[] => {
  return metricCategories.map(toMResponseDTOLegacy);
};
