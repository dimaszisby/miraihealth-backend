// src/types/domain/metric-settings.domain.ts

export interface MetricSettingsDomain {
  id: string;
  metricId: string;
  isActive?: boolean;
  goalEnabled?: boolean;
  goalType?: "cumulative" | "incremental" | null;
  goalValue?: number | null;
  timeFrameEnabled?: boolean;
  startDate?: Date | null;
  deadlineDate?: Date | null;
  alertEnabled?: boolean;
  alertThresholds?: number;
  isAchieved?: boolean;
  displayOptions?: {
    showOnDashboard?: boolean;
    priority?: number;
    chartType?: string;
    color?: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
