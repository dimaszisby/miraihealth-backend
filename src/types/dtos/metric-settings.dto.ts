// src/types/dtos/metric-settings.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricSettingsSchema,
  updateMetricSettingsSchema,
} from "@/types/api/zod-metric-settings.schema";

/**
 * @file src/types/dtos/metric-settings.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricSettings.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 */

/**
 * @interface DisplayOptionsDTO
 * @description Represents the display options for a metric setting DTO.
 */
export interface DisplayOptionsDTO {
  /**
   * @property {boolean} [showOnDashboard] - Whether the metric should be shown on the dashboard.
   * @readonly
   */
  readonly showOnDashboard: boolean | null;
  /**
   * @property {number} [priority] - Display priority (lower number = higher priority).
   * @readonly
   */
  readonly priority: number | null;
  /**
   * @property {string} [chartType] - Preferred chart type (e.g., 'line', 'bar').
   * @readonly
   */
  readonly chartType: string | null;
  /**
   * @property {string} [color] - Specific color code (e.g., hex).
   * @readonly
   */
  readonly color: string | null;
}

/**
 * @interface MetricSettingsResponseDTO
 * @description Represents the structure of a MetricSettings object as returned in API responses.
 */
export interface MetricSettingsResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric settings (typically a UUID).
   * @readonly
   */
  readonly id: string;
  /**
   * @property {string} metricId - The identifier of the metric these settings apply to.
   * @readonly
   */
  readonly metricId: string;
  /**
   * @property {boolean} [isActive] - Flag indicating if these settings are currently active.
   * @readonly
   */
  readonly isActive: boolean | null;
  /**
   * @property {boolean} [goalEnabled] - Flag indicating if a goal is set for this metric.
   * @readonly
   */
  readonly goalEnabled: boolean | null;
  /**
   * @property {'cumulative' | 'incremental' | null} [goalType] - The type of goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalType: "cumulative" | "incremental" | null;
  /**
   * @property {number} [goalValue] - The target value for the goal, if enabled. Null otherwise.
   * @readonly
   */
  readonly goalValue: number | null;
  /**
   * @property {boolean} [timeFrameEnabled] - Flag indicating if a specific time frame is set for the goal.
   * @readonly
   */
  readonly timeFrameEnabled: boolean | null;
  /**
   * @property {string} [startDate] - The start date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly startDate: string | null;
  /**
   * @property {string} [deadlineDate] - The deadline date for the goal's time frame. Null if timeframe is disabled.
   * @readonly
   */
  readonly deadlineDate: string | null;
  /**
   * @property {boolean} [alertEnabled] - Flag indicating if alerts are enabled for goal progress.
   * @readonly
   */
  readonly alertEnabled: boolean | null;
  /**
   * @property {number} [alertThresholds] - The percentage threshold (0-100) for alerts. Null if alerts are disabled.
   * @readonly
   */
  readonly alertThresholds: number | null;
  /**
   * @property {boolean} [isAchieved] - Flag indicating if the goal has been achieved.
   * @readonly
   */
  readonly isAchieved: boolean | null;
  /**
   * @property {DisplayOptionsDTO} [displayOptions] - Object containing display-related settings.
   * @readonly
   */
  readonly displayOptions: DisplayOptionsDTO | null;
  /**
   * @property {string} createdAt - The timestamp when these settings were created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;
  /**
   * @property {string} updatedAt - The timestamp when these settings were last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

/**
 * @typedef CreateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when creating new metric settings.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricSettingsRequestDTO = z.infer<
  typeof createMetricSettingsSchema.shape.body
>;

/**
 * @typedef UpdateMetricSettingsRequestDTO
 * @description Represents the expected structure of the request body when updating existing metric settings.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricSettingsRequestDTO = z.infer<
  typeof updateMetricSettingsSchema.shape.body
>;
