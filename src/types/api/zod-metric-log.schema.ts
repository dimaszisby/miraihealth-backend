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
  query: z.object({
    startDate: zDateOptional,
    endDate: zDateOptional,
    sortBy: z.string().optional(),
    order: z.enum(["asc", "desc"]).optional(),
    page: z.preprocess(Number, z.number().int().min(1)).optional().default(1),
    limit: z.preprocess(Number, z.number().int().min(1)).optional().default(10),
  }).optional(),
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

/**
 * * ===== Schemas for Testing Purposes =====
 */

export const generateDummyMetricLogsSchema = z.object({
  params: z.object({
    metricId: zUUID,
  }),
  body: z.object({
    count: z.number().int().min(1).max(1000).default(50), // Default to 50, max 1000 to prevent abuse
  }),
});
