// src/types/dtos/metric-log.dto.ts

import { z } from "zod";

// Internal validation schemas
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  generateDummyMetricLogsSchema,
} from "@/types/api/zod-metric-log.schema";

/**
 * @file src/types/dtos/metric-log.dto.ts
 * @description Defines the Data Transfer Objects (DTOs) for MetricLog.
 * These interfaces and types are used for incoming and outgoing API contracts,
 * defining the structure of data exchanged between the client and server.
 * DTOs are often immutable.
 */

/**
 * @interface MetricLogResponseDTO
 * @description Represents the structure of a MetricLog object as returned in API responses.
 */
export interface MetricLogResponseDTO {
  /**
   * @property {string} id - The unique identifier for the metric log entry (typically a UUID).
   * @readonly
   */
  readonly id: string;

  /**
   * @property {string} metricId - The identifier of the metric this log entry belongs to.
   * @readonly
   */
  readonly metricId: string;

  /**
   * @property {'manual' | 'automatic'} type - Indicates how the log entry was created ('manual' or 'automatic').
   * @readonly
   */
  readonly type: "manual" | "automatic";

  /**
   * @property {number} logValue - The numerical value recorded for the metric in this log entry.
   * @readonly
   */
  readonly logValue: number;

  /**
   * @property {string} loggedAt - The timestamp when the metric value was actually recorded, formatted as an ISO string.
   * @readonly
   */
  readonly loggedAt: string; // ISO string

  /**
   * @property {string} createdAt - The timestamp when the log entry was created, formatted as an ISO string.
   * @readonly
   */
  readonly createdAt: string;

  /**
   * @property {string} updatedAt - The timestamp when the log entry was last updated, formatted as an ISO string.
   * @readonly
   */
  readonly updatedAt: string;
}

/**
 * @typedef MetricLogListResponseDTO
 * @description Represents a list (array) of MetricLogResponseDTO objects, typically returned in API responses for collections of metric logs.
 */
export type MetricLogListResponseDTO = MetricLogResponseDTO[];

/**
 * @typedef CreateMetricLogRequestDTO
 * @description Represents the expected structure of the request body when creating a new metric log entry.
 * Inferred from the Zod schema for validation.
 */
export type CreateMetricLogRequestDTO = z.infer<
  typeof createMetricLogSchema.shape.body
>;
/**
 * @typedef UpdateMetricLogRequestDTO
 * @description Represents the expected structure of the request body when updating an existing metric log entry.
 * Inferred from the Zod schema for validation.
 */
export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.shape.body
>;

/**
 * * ===== DTOs for Testing Purposes =====
 */

/**
 * @typedef GenerateDummyMetricLogsRequestDTO
 * @description Represents the expected structure of the request body when generating dummy metric log entries.
 * Inferred from the Zod schema for validation.
 */
export type GenerateDummyMetricLogsRequestDTO = z.infer<
  typeof generateDummyMetricLogsSchema.shape.body
>;
