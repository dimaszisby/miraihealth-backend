import {
  MetricDomain,
  MetricDomainExtended,
  MetricLibraryDomain,
} from "@/types/domain/metric.domain.js";
import {
  MetricPreviewResponseDTO,
  MetricResponseDTO,
  UserMetricDetailResponseDTO,
} from "@/types/dtos/metric.dto.js";
import { toResponseDTO as toMetricCategoryResponseDTO } from "@/features/metric-category/infrastructure/mappers/MetricCategoryMapper.js";
import { toMetricSettingsResponseDTO } from "@/features/metric-settings/infrastructure/persistence/mappers/MetricSettingsMapper.js";
import { toMetricLogResponseDTO } from "@/features/metric-log/infrastructure/http/dto.js";

export const toMetricResponseDTO = (
  metric: MetricDomain,
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
});

export const toUserMetricDetailResponseDTO = (
  metric: MetricDomainExtended,
): UserMetricDetailResponseDTO => ({
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
  category: metric.category
    ? toMetricCategoryResponseDTO(metric.category)
    : null,
  settings: metric.settings
    ? toMetricSettingsResponseDTO(metric.settings)
    : null,
  logs: metric.logs ? metric.logs?.map(toMetricLogResponseDTO) : null,
});

export const toMetricLibraryResponseDTO = (
  metric: MetricLibraryDomain,
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
