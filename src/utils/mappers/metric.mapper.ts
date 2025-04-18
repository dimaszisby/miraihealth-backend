// src/utils/mappers/metric.mapper.ts

// Sequelize models
import { Metric } from "@/models/metric.model";
import { MetricLibraryDomain, MetricLibraryListDomain } from "@/types/domain/metric.domain";
import { MetricCategory } from "@/models/metric-category.model";
import { MetricSettings } from "@/models/metric-settings.model";
import { MetricLog } from "@/models/metric-log.model";

// Domain types
import {
  MetricDomain,
  MetricDomainExtended,
} from "@/types/domain/metric.domain";

// DTO types
import {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  UserMetricDetailResponseDTO,
} from "@/types/dtos/metric.dto"; // Added UserMetricDetailResponseDTO
import logger from "../logger"; // Import logger for error logging

// Import mappers for associated entities (assuming they exist)
// DTO Mappers (Domain -> DTO)
import { toMetricCategoryResponseDTO } from "./metric-category.mapper";
import { toMetricSettingsResponseDTO } from "./metric-settings.mapper";
import { toMetricLogResponseDTO } from "./metric-log.mapper";
// Domain Mappers (Model -> Domain)
import { toDomainMetricCategory } from "./metric-category.mapper";
import { toDomainMetricSettings } from "./metric-settings.mapper";
import { toDomainMetricLog } from "./metric-log.mapper";

/**
 * * Mapper: Sequelize → Domain
 */
export const toDomainMetric = (metric: Metric): MetricDomain => {
  // userId is crucial and should exist on the Metric model instance
  if (!metric.userId) {
    logger.error("Metric object missing userId:", { metricId: metric.id }); // Log error
    // Throw an error as userId is required for the domain model
    throw new Error(
      `Metric with id ${metric.id} is missing the required userId.`,
    );
  }
  return {
    id: metric.id,
    userId: metric.userId, // Now guaranteed to be string
    categoryId: metric.categoryId ?? null,
    originalMetricId: metric.originalMetricId ?? null,
    name: metric.name,
    description: metric.description ?? null, // Use null to match Domain type (string | null)
    defaultUnit: metric.defaultUnit,
    isPublic: metric.isPublic,
    deletedAt: metric.deletedAt ?? null,
    // Assuming createdAt/updatedAt are guaranteed non-null by Sequelize model/query
    createdAt: metric.createdAt!,
    updatedAt: metric.updatedAt!,
  };
};

// Define a type for Metric with expected associations loaded via Sequelize includes
// Adjust aliases ('MetricCategory', 'MetricSettings', 'MetricLogs') if they differ in your model definitions/queries
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
  metric: MetricWithAssociations,
): MetricDomainExtended => {
  const domain = toDomainMetric(metric); // Use the base mapper first

  // Use the dedicated mapper for category
  const categoryDomain = metric.MetricCategory
    ? toDomainMetricCategory(metric.MetricCategory)
    : undefined;

  // Use the dedicated mapper for settings
  const settingsDomain = metric.MetricSettings
    ? toDomainMetricSettings(metric.MetricSettings)
    : undefined;

  // Use the dedicated mapper for logs
  const logsDomain = metric.MetricLogs
    ? metric.MetricLogs.map(toDomainMetricLog) // Map each log using its mapper
    : undefined;

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
  metric: MetricDomain, // Takes the base domain object
): MetricResponseDTO => ({
  id: metric.id,
  userId: metric.userId,
  categoryId: metric.categoryId ?? null,
  originalMetricId: metric.originalMetricId ?? null,
  name: metric.name,
  description: metric.description ?? null,
  defaultUnit: metric.defaultUnit,
  isPublic: metric.isPublic,
  // DTOs typically use ISO strings for dates
  createdAt: metric.createdAt.toISOString(),
  updatedAt: metric.updatedAt.toISOString(),
  // deletedAt is usually not included in success responses unless specifically needed
});

/**
 * * Mapper: Domain (Extended) → DTO (for Detailed Metric API Response)
 */
export const toUserMetricDetailResponseDTO = (
  metric: MetricDomainExtended, // Takes the extended domain object
): UserMetricDetailResponseDTO => ({
  // Map base metric fields
  id: metric.id,
  userId: metric.userId,
  categoryId: metric.categoryId ?? null,
  originalMetricId: metric.originalMetricId ?? null,
  name: metric.name,
  description: metric.description ?? null,
  defaultUnit: metric.defaultUnit,
  isPublic: metric.isPublic,
  createdAt: metric.createdAt.toISOString(),
  updatedAt: metric.updatedAt.toISOString(),

  // Map associated data using their respective DTO mappers
  category: metric.category
    ? toMetricCategoryResponseDTO(metric.category)
    : null,
  settings: metric.settings
    ? toMetricSettingsResponseDTO(metric.settings)
    : null,
  logs: metric.logs ? metric.logs.map(toMetricLogResponseDTO) : null,
});

/**
 * * Mapper: Domain → DTO (for Metric Library Response)
 */
// This is a simplified version of the metric, typically used in public libraries or templates
// It may not include all fields from the full MetricDomain
// and is designed for quick display or selection
export const toMetricLibraryResponseDTO = (
  metric: MetricLibraryDomain,
): MetricPreviewResponseDTO => ({
  id: metric.id,
  name: metric.name,
  category: metric.category,
  goalType: metric.goalType,
});
