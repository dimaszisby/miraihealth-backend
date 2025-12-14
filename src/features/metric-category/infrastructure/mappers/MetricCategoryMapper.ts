import { MetricCategory as MetricCategorySequelize } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { MetricCategory as MetricCategoryDomain } from "@/features/metric-category/domain/entities/MetricCategory";
import { MetricCategoryResponseDTO } from "@/features/metric-category/infrastructure/http/dto";

export type MetricCategoryRow = {
  id: string;
  userId: string;
  name: string;
  color: string;
  icon: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
  metricCount?: number; // from SELECT literal
};

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomain = (row: MetricCategoryRow): MetricCategoryDomain =>
  MetricCategoryDomain.fromProps({
    id: row.id,
    userId: row.userId,
    name: row.name,
    color: row.color,
    icon: row.icon,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    deletedAt: row.deletedAt ?? null,
    metricCount: Number(row.metricCount ?? 0),
  });

/**
 * * Sequelize[] → Domain[] Mapper
 */
// Dev Note Update: ADDED
export const toListDomain = (
  rows: MetricCategoryRow[]
): MetricCategoryDomain[] => rows.map(toDomain);

/**
 * * Mapper: Domain → DTO (for responses)
 */
export const toResponseDTO = (
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

export const toListResponseDTO = (
  metricCategories: MetricCategoryDomain[]
): MetricCategoryResponseDTO[] => {
  return metricCategories.map(toResponseDTO);
};
