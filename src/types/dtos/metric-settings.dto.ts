// src/types/dtos/metric-settings.dto.ts

import { z } from "zod";
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
} from "@/types/api/zod-metric-settings.schema";

export interface MetricSettingsResponseDTO {
  id: string;
  metricId: string;
  isActive?: boolean;
  goalEnabled?: boolean;
  goalType?: "cumulative" | "incremental" | null;
  goalValue?: number | null;
  timeFrameEnabled?: boolean;
  startDate?: string | null;
  deadlineDate?: string | null;
  alertEnabled?: boolean;
  alertThresholds?: number;
  isAchieved?: boolean;
  displayOptions?: {
    showOnDashboard?: boolean;
    priority?: number;
    chartType?: string;
    color?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface DisplayOptionsDTO {
  showOnDashboard?: boolean;
  priority?: number;
  chartType?: string;
  color?: string;
}

export type CreateMetricSettingsRequestDTO = z.infer<
  typeof createMetricSettingsSchema.shape.body
>;
export type UpdateMetricSettingsRequestDTO = z.infer<
  typeof updateMetricSettingsSchema.shape.body
>;
