import { MetricSettings } from "../persistence/models/metric-settings.sequelize.js";
import { MetricSettingsDomain } from "@/types/domain/metric-settings.domain.js";
import {
  DisplayOptionsDTO,
  MetricSettingsResponseDTO,
} from "../http/dto.js";

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
  alertThresholds: settings.alertThresholds,
  isAchieved: settings.isAchieved,
  displayOptions: normalizeDisplayOptions(settings.displayOptions),
  createdAt: settings.createdAt!,
  updatedAt: settings.updatedAt!,
});

export const toMetricSettingsResponseDTO = (
  domain: MetricSettingsDomain
): MetricSettingsResponseDTO => {
  const startDateString = domain.startDate?.toISOString() ?? null;
  const deadlineDateString = domain.deadlineDate?.toISOString() ?? null;

  return {
    id: domain.id,
    metricId: domain.metricId,
    isActive: domain.isActive,
    goalEnabled: domain.goalEnabled,
    goalType: domain.goalType,
    goalValue: domain.goalValue,
    timeFrameEnabled: domain.timeFrameEnabled,
    startDate: startDateString,
    deadlineDate: deadlineDateString,
    alertEnabled: domain.alertEnabled,
    alertThresholds: domain.alertThresholds,
    isAchieved: domain.isAchieved,
    displayOptions: domain.displayOptions,
    createdAt: domain.createdAt.toISOString(),
    updatedAt: domain.updatedAt.toISOString(),
  };
};

export const toDisplayOptionsResponseDTO = (
  displayOptions: MetricSettingsDomain["displayOptions"]
): DisplayOptionsDTO => ({
  showOnDashboard: displayOptions?.showOnDashboard ?? false,
  priority: displayOptions?.priority ?? 1,
  chartType: displayOptions?.chartType ?? "line",
  color: displayOptions?.color ?? "#E897A3",
});

export const toDomainDisplayOptions = (
  settings: MetricSettings
): MetricSettingsDomain["displayOptions"] =>
  normalizeDisplayOptions(settings.displayOptions);

const normalizeDisplayOptions = (
  opts: any = {}
): MetricSettingsDomain["displayOptions"] => ({
  showOnDashboard: opts.showOnDashboard ?? false,
  priority: opts.priority ?? 1,
  chartType: opts.chartType ?? "line",
  color: opts.color ?? "#E897A3",
});
