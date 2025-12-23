import { Metric } from "@/features/metric/infrastructure/persistence/models/metric.sequelize.js";
import { MetricLibraryDomain } from "@/types/domain/metric.domain.js";
import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize.js";
import {
  toDomain as toMetricCategoryDomain,
  toResponseDTO as toMetricCategoryResponseDTO,
  MetricCategoryRow,
} from "@/features/metric-category/infrastructure/mappers/MetricCategoryMapper.js";
import { MetricSettings } from "@/features/metric-settings/infrastructure/persistence/models/metric-settings.sequelize.js";
import { MetricLog } from "@/features/metric-log/infrastructure/persistence/models/metric-log.sequelize.js";
import {
  MetricDomain,
  MetricDomainExtended,
  MetricLibraryCategoryInfoDomain,
} from "@/types/domain/metric.domain.js";
import {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  UserMetricDetailResponseDTO,
} from "@/types/dtos/metric.dto.js";
import logger from "../logger.js";
import AppError from "@/utils/AppError.js";
import {
  toMetricSettingsResponseDTO,
  toDomainMetricSettings,
} from "@/features/metric-settings/infrastructure/mappers/MetricSettingsMapper.js";
import { toMetricLogResponseDTO } from "./metric-log.mapper.js";
import { toDomainMetricLog } from "./metric-log.mapper.js";

const toCategoryRow = (category: Partial<MetricCategoryRow>): MetricCategoryRow => ({
  id: category.id ?? "",
  userId: category.userId ?? "",
  name: category.name ?? "",
  color: category.color ?? "#E897A3",
  icon: category.icon ?? "📁",
  createdAt: category.createdAt ? new Date(category.createdAt) : new Date(0),
  updatedAt: category.updatedAt
    ? new Date(category.updatedAt)
    : category.createdAt
    ? new Date(category.createdAt)
    : new Date(0),
  metricCount: Number(category.metricCount ?? 0),
});

const toCategoryInfo = (
  category: ReturnType<typeof toMetricCategoryDomain>
): MetricLibraryCategoryInfoDomain => ({
  id: category.id,
  name: category.name,
  color: category.color,
  icon: category.icon,
});

const validateUserId = (userId: string | null | undefined) => {
  if (!userId) {
    logger.error("Metric object missing userId");
    throw new AppError(
      "Metric is missing the required userId. This indicates a data integrity issue.",
      500
    );
  }
  return userId;
};

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainMetric = (metric: Metric): MetricDomain => {
  validateUserId(metric.userId);

  return {
    id: metric.id,
    userId: metric.userId,
    categoryId: metric.categoryId,
    originalMetricId: metric.originalMetricId,
    name: metric.name,
    description: metric.description,
    defaultUnit: metric.defaultUnit,
    isPublic: metric.isPublic,
    deletedAt: metric.deletedAt ?? null,
    createdAt: metric.createdAt!,
    updatedAt: metric.updatedAt!,
  };
};

export const toDomainMetricLibrary = (
  metric: Metric & { logCount?: number }
): MetricLibraryDomain => {
  validateUserId(metric.userId);

  // Accept both shapes: instance include (MetricCategory) and raw+alias include (category)
  const rawCategory =
    (metric as any).MetricCategory ?? (metric as any).category ?? null;

  const categoryDomain = rawCategory ? toDomainCategoryInfo(rawCategory) : null;

  // Guard against NaN if the subquery isn't present for any reason
  const logCount = Number((metric as any).logCount ?? 0);

  return {
    id: metric.id,
    name: metric.name,
    description: metric.description,
    defaultUnit: metric.defaultUnit,
    isPublic: metric.isPublic,
    category: categoryDomain,
    goalType: metric?.MetricSettings?.goalType ?? "Not Set",
    createdAt: metric.createdAt!,
    updatedAt: metric.updatedAt!,
    logCount,
  };
};

const toDomainCategoryInfo = (
  category: MetricCategory
): MetricLibraryCategoryInfoDomain => {
  return {
    id: category.id,
    name: category.name,
    icon: category.icon,
    color: category.color,
  };
};

type MetricWithAssociations = Metric & {
  MetricCategory?: MetricCategory | null;
  MetricSettings?: MetricSettings | null;
  MetricLogs?: MetricLog[] | null;
};

/**
 * * Mapper: Sequelize (with associations) → Domain (Extended)
 */
// TODO: Refactor this mapper to use the base mapper first for each association for better readability
export const toExtendedMetricDomain = (
  metric: MetricWithAssociations
): MetricDomainExtended => {
  const domain = toDomainMetric(metric);

  const rawCategory =
    (metric as any).MetricCategory ?? (metric as any).category ?? null;
  const categoryDomain = rawCategory
    ? toMetricCategoryDomain(toCategoryRow(rawCategory))
    : null;
  const categorySummary = categoryDomain
    ? toCategoryInfo(categoryDomain)
    : null;

  const rawSettings =
    (metric as any).MetricSettings ?? (metric as any).settings ?? null;
  const settingsDomain = rawSettings
    ? toDomainMetricSettings(rawSettings)
    : null;

  const rawLogs = (metric as any).MetricLogs ?? (metric as any).logs ?? null;
  const logsDomain = rawLogs ? rawLogs.map(toDomainMetricLog) : null;

  return {
    ...domain,
    category: categorySummary,
    settings: settingsDomain,
    logs: logsDomain,
  };
};

/**
 * * Mapper: Domain → DTO (for API Response - Base Metric)
 */
export const toMetricResponseDTO = (
  metric: MetricDomain // Takes the base domain object
): MetricResponseDTO => ({
  id: metric.id,
  userId: metric.userId,
  categoryId: metric.categoryId,
  originalMetricId: metric.originalMetricId,
  name: metric.name,
  description: metric.description,
  defaultUnit: metric.defaultUnit,
  isPublic: metric.isPublic,
  createdAt: metric.createdAt.toISOString(),
  updatedAt: metric.updatedAt.toISOString(),
  // deletedAt
});

/**
 * * Mapper: Domain (Extended) → DTO (for Detailed Metric API Response)
 */
export const toUserMetricDetailResponseDTO = (
  metric: MetricDomainExtended
): UserMetricDetailResponseDTO => ({
  // Map base
  id: metric.id,
  userId: metric.userId,
  categoryId: metric.categoryId,
  originalMetricId: metric.originalMetricId,
  name: metric.name,
  description: metric.description,
  defaultUnit: metric.defaultUnit,
  isPublic: metric.isPublic,
  createdAt: metric.createdAt.toISOString(),
  updatedAt: metric.updatedAt.toISOString(),

  // Map associated
    category: metric.category
      ? toMetricCategoryResponseDTO(
          toMetricCategoryDomain(toCategoryRow(metric.category as any))
        )
      : null,
  settings: metric.settings
    ? toMetricSettingsResponseDTO(metric.settings)
    : null,
  logs: metric.logs ? metric.logs?.map(toMetricLogResponseDTO) : null,
});

/**
 * * Mapper: Domain → DTO (for Metric Library Response)
 */
export const toMetricLibraryResponseDTO = (
  metric: MetricLibraryDomain
): MetricPreviewResponseDTO => ({
  id: metric.id,
  name: metric.name,
  category: metric.category,
  goalType: metric.goalType,
  defaultUnit: metric.defaultUnit,
  description: metric.description,
  isPublic: metric.isPublic,
  logCount: metric.logCount,
});
