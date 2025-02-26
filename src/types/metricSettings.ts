// src/types/metricSettings.ts

/**
 * * MetricSettings Types
 * Represents the Domain Types of Metric Settings
 * Describe the shape of data as the application uses it
 */

export interface MetricSettingsBase {
  goalEnabled: boolean;
  goalType?: "cumulative" | "incremental" | null;
  goalValue?: number | null;
  timeFrameEnabled: boolean;
  startDate?: string | null;
  deadlineDate?: string | null;
  alertEnabled: boolean;
  alertThresholds?: number | null;
  isAchieved: boolean;
  isActive: boolean;
  displayOptions: {
    showOnDashboard: boolean;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
}
