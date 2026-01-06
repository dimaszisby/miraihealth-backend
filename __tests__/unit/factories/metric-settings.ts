import { MetricSettings } from "@/features/metric-settings/domain/entities/MetricSettings.js";
import { MetricSettingsProps } from "@/features/metric-settings/domain/entities/MetricSettings.js";

type Overrides = Partial<MetricSettingsProps> & {
  displayOptions?: Partial<MetricSettingsProps["displayOptions"]>;
};

const baseDisplay = {
  showOnDashboard: true,
  priority: 1,
  chartType: "line",
  color: "#E897A3",
};

const baseProps: MetricSettingsProps = {
  id: "settings-1",
  metricId: "metric-1",
  isActive: true,
  goalEnabled: false,
  goalType: null,
  goalValue: null,
  timeFrameEnabled: false,
  startDate: null,
  deadlineDate: null,
  alertEnabled: false,
  alertThresholds: null,
  isAchieved: false,
  displayOptions: { ...baseDisplay },
  createdAt: new Date("2024-01-01T00:00:00.000Z"),
  updatedAt: new Date("2024-01-01T00:00:00.000Z"),
};

export const buildMetricSettings = (
  overrides: Overrides = {},
): MetricSettings => {
  return MetricSettings.fromPersistence({
    ...baseProps,
    ...overrides,
    displayOptions: {
      ...baseDisplay,
      ...overrides.displayOptions,
    },
  });
};
