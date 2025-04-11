// src/types/api/zod-metric-log.schema.ts

import { z } from "zod";
import {
  zUUID,
  zLogType,
  zPositiveFloat,
  zDateOptional,
} from "@/validators/zod-rules";

export const createMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
  body: z.object({
    type: zLogType.optional().default("manual"),
    logValue: zPositiveFloat,
    loggedAt: zDateOptional,
  }),
});

export const updateMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
  body: z.object({
    type: zLogType.optional(),
    logValue: zPositiveFloat.optional(),
    loggedAt: zDateOptional,
  }),
});

export const getMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getAllMetricLogsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
});

export const deleteMetricLogSchema = z.object({
  params: z.object({
    metricId: zUUID,
    id: zUUID,
  }),
});

export const getAggregatedStatsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
});
