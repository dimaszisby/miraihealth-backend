// src/types/dtos/metric-log.dto.ts

import { z } from "zod";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
} from "@/types/api/zod-metric-log.schema";

export interface MetricLogResponseDTO {
  id: string;
  metricId: string;
  type: "manual" | "automatic";
  logValue: number;
  loggedAt: string; // ISO string
  createdAt: string;
  updatedAt: string;
}

/**
 * * A list of Metric Log Response DTOs
 */
export type MetricLogListResponseDTO = MetricLogResponseDTO[];

export type CreateMetricLogRequestDTO = z.infer<
  typeof createMetricLogSchema.shape.body
>;
export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.shape.body
>;
