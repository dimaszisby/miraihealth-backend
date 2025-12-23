import { MetricSettings } from "../entities/MetricSettings.js";

export type CreateMetricSettingsDTO = {
  metricId: string;
  isActive: boolean;
  goalEnabled: boolean;
  goalType: "cumulative" | "incremental" | null;
  goalValue: number | null;
  timeFrameEnabled: boolean;
  startDate: Date | null;
  deadlineDate: Date | null;
  alertEnabled: boolean;
  alertThresholds: number | null;
  isAchieved: boolean;
  displayOptions: {
    showOnDashboard: boolean;
    priority: number | null;
    chartType: string | null;
    color: string | null;
  };
};

export interface MetricSettingsRepository {
  create(data: CreateMetricSettingsDTO): Promise<MetricSettings>;
  findByMetricId(metricId: string): Promise<MetricSettings | null>;
  findById(userId: string, settingsId: string): Promise<MetricSettings | null>;
  save(settings: MetricSettings): Promise<MetricSettings>;
  delete(settings: MetricSettings): Promise<void>;
  listByCursor(
    opts: ListMetricSettingsOptions
  ): Promise<ListMetricSettingsResult>;
}

export type SortField = "createdAt" | "updatedAt" | "isActive";
export type SortParam = SortField | `-${SortField}`;

export type ListMetricSettingsOptions = {
  userId: string;
  limit: number;
  sort: SortParam;
  q?: string;
  filter?: { metricId?: string; isActive?: boolean };
  after?: string;
  includeTotal?: boolean;
};

export type ListMetricSettingsResult = {
  items: MetricSettings[];
  nextCursor?: string;
  sort: SortParam;
  limit: number;
  q?: string;
  filter?: { metricId?: string; isActive?: boolean };
  totalCount?: number;
};
