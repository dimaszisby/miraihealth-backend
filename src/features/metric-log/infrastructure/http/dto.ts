import { z } from "zod";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  generateDummyMetricLogsSchema,
} from "./schema.zod.js";

export interface MetricLogResponseDTO {
  readonly id: string;
  readonly metricId: string;
  readonly type: "manual" | "automatic";
  readonly logValue: number;
  readonly loggedAt: string;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export type MetricLogListResponseDTO = MetricLogResponseDTO[];

export type CreateMetricLogRequestDTO = z.infer<
  typeof createMetricLogSchema.shape.body
>;

export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.shape.body
>;

export type GenerateDummyMetricLogsRequestDTO = z.infer<
  typeof generateDummyMetricLogsSchema.shape.body
>;
