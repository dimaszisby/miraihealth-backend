// src/utils/mappers/metric-settings.mapper.ts

import { MetricSettings } from "@/models/metric-settings.model";
import { MetricSettingsDomain } from "@/types/domain/metric-settings.domain";
import {
  DisplayOptionsDTO,
  MetricSettingsResponseDTO,
} from "@/types/dtos/metric-settings.dto";

/**
 * * Sequelize → Domain Mapper
 */
export const toDomainMetricSettings = (
  settings: MetricSettings
): MetricSettingsDomain => ({
  id: settings.id,
  metricId: settings.metricId,
  isActive: settings.isActive,
  goalEnabled: settings.goalEnabled,
  goalType: settings.goalType,
  goalValue: settings.goalValue,
  timeFrameEnabled: settings.timeFrameEnabled,
  startDate: settings.startDate ? new Date(settings.startDate) : null,
  deadlineDate: settings.deadlineDate ? new Date(settings.deadlineDate) : null,
  alertEnabled: settings.alertEnabled,
  alertThresholds: settings.alertThresholds ?? undefined,
  isAchieved: settings.isAchieved,
  displayOptions: normalizeDisplayOptions(settings.displayOptions),
  createdAt: settings.createdAt!,
  updatedAt: settings.updatedAt!,
});

/**
 * * Domain → Response DTO
 */
export const toMetricSettingsResponseDTO = (
  domain: MetricSettingsDomain
): MetricSettingsResponseDTO => ({
  id: domain.id,
  metricId: domain.metricId,
  isActive: domain.isActive,
  goalEnabled: domain.goalEnabled,
  goalType: domain.goalType,
  goalValue: domain.goalValue,
  timeFrameEnabled: domain.timeFrameEnabled,
  startDate: domain.startDate?.toISOString() ?? null,
  deadlineDate: domain.deadlineDate?.toISOString() ?? null,
  alertEnabled: domain.alertEnabled,
  alertThresholds: domain.alertThresholds,
  isAchieved: domain.isAchieved,
  displayOptions: domain.displayOptions,
  createdAt: domain.createdAt.toISOString(),
  updatedAt: domain.updatedAt.toISOString(),
});

/**
 * * Sequelize → Domain Mapper
 */
export const toDomainDisplayOptions = (
  settings: MetricSettings
): MetricSettingsDomain["displayOptions"] =>
  normalizeDisplayOptions(settings.displayOptions);

/**
 * * Domain → Request DTO
 */
export const toDisplayOptionsResponseDTO = (
  displayOptions: MetricSettingsDomain["displayOptions"]
): DisplayOptionsDTO => ({
  showOnDashboard: displayOptions?.showOnDashboard ?? true,
  priority: displayOptions?.priority ?? 1,
  chartType: displayOptions?.chartType ?? "line",
  color: displayOptions?.color ?? "#E897A3",
});

/**
 * Helpers
 */

/**
 * Helper function to normalize display options
 * @param opts - The display options to normalize
 * @returns
 */
const normalizeDisplayOptions = (
  opts: any = {}
): MetricSettingsDomain["displayOptions"] => ({
  showOnDashboard: opts.showOnDashboard ?? true,
  priority: opts.priority ?? 1,
  chartType: opts.chartType ?? "line",
  color: opts.color ?? "#E897A3",
});
