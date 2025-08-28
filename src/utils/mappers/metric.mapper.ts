import { Metric } from "@/models/metric.model";
import { MetricLibraryDomain } from "@/types/domain/metric.domain";
import { MetricCategory } from "@/features/metric-category/infrastructure/persistence/models/metric-category.sequelize";
import { MetricSettings } from "@/models/metric-settings.model";
import { MetricLog } from "@/models/metric-log.model";
import {
  MetricDomain,
  MetricDomainExtended,
  MetricLibraryCategoryInfoDomain,
} from "@/types/domain/metric.domain";
import {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  UserMetricDetailResponseDTO,
} from "@/types/dtos/metric.dto";
import logger from "../logger";
import AppError from "@/utils/AppError";
import { toMetricSettingsResponseDTO } from "./metric-settings.mapper";
import { toMetricLogResponseDTO } from "./metric-log.mapper";
import { toDomainMetricSettings } from "./metric-settings.mapper";
import { toDomainMetricLog } from "./metric-log.mapper";
import {
  toDomainLegacy,
  toMResponseDTOLegacy as toResponseDTOLegacy,
} from "@/features/metric-category/legacies/MetricCategoryLegacy.mapper";

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainMetric = (metric: Metric): MetricDomain => {
  if (!metric.userId) {
    logger.error("Metric object missing userId:", { metricId: metric.id });
    throw new AppError(
      `Metric with id ${metric.id} is missing the required userId. This indicates a data integrity issue.`,
      500
    );
  }
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
  if (!metric.userId) {
    logger.error("Metric object missing userId:", { metricId: metric.id });
    throw new AppError(
      `Metric with id ${metric.id} is missing the required userId. This indicates a data integrity issue.`,
      500
    );
  }

  // normalize
  const categoryDomain = metric.MetricCategory
    ? toDomainCategoryInfo(metric.MetricCategory)
    : null;
  const settingsDomain = metric.MetricSettings?.goalType ?? "Not Set";

  return {
    id: metric.id,
    name: metric.name,
    description: metric.description,
    defaultUnit: metric.defaultUnit,
    isPublic: metric.isPublic,
    category: categoryDomain,
    goalType: settingsDomain,
    createdAt: metric.createdAt!,
    updatedAt: metric.updatedAt!,
    logCount: Number(metric.logCount) ?? 0,
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
  const categoryDomain = rawCategory ? toDomainLegacy(rawCategory) : null;

  const rawSettings =
    (metric as any).MetricSettings ?? (metric as any).settings ?? null;
  const settingsDomain = rawSettings
    ? toDomainMetricSettings(rawSettings)
    : null;

  const rawLogs = (metric as any).MetricLogs ?? (metric as any).logs ?? null;
  const logsDomain = rawLogs ? rawLogs.map(toDomainMetricLog) : null;

  return {
    ...domain,
    category: categoryDomain,
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
  category: metric.category ? toResponseDTOLegacy(metric.category) : null,
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
