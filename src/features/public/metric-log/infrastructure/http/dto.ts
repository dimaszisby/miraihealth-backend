import { z } from "zod";
import {
  createMetricLogSchema,
  updateMetricLogSchema,
  generateDummyMetricLogsSchema,
} from "./schema.zod.js";
import { MetricLogDomain } from "@/types/domain/metric-log.domain.js";

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

export const toMetricLogResponseDTO = (
  domain: MetricLogDomain,
): MetricLogResponseDTO => ({
  id: domain.id,
  metricId: domain.metricId,
  type: domain.type,
  logValue: domain.logValue,
  loggedAt: domain.loggedAt.toISOString(),
  createdAt: domain.createdAt.toISOString(),
  updatedAt: domain.updatedAt.toISOString(),
});

export const toMetricLogListResponseDTO = (
  logs: MetricLogDomain[],
): MetricLogListResponseDTO => logs.map(toMetricLogResponseDTO);

export type CreateMetricLogRequestDTO = z.infer<
  typeof createMetricLogSchema.shape.body
>;

export type UpdateMetricLogRequestDTO = z.infer<
  typeof updateMetricLogSchema.shape.body
>;

export type GenerateDummyMetricLogsRequestDTO = z.infer<
  typeof generateDummyMetricLogsSchema.shape.body
>;
