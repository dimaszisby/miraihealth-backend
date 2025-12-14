import { z } from "zod";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  generateDummyMetricLogsSchema,
} from "./schema.zod";

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
  typeof createMetricLogSchema.body
>;

export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.body
>;

export type GenerateDummyMetricLogsRequestDTO = z.infer<
  typeof generateDummyMetricLogsSchema.body
>;
