// src/types/api/zod-metric-log.schema.ts

import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";

extendZodWithOpenApi(z);

import {
  zDateOptional,
  zLogType,
  zPositiveFloat,
  zUUID,
} from "@/constants/zod/zod-rules";
import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages";

// * Base
export const metricLogBody = z.object({
  metricId: zUUID,
  type: zLogType.optional().default("manual"),
  logValue: zPositiveFloat,
  loggedAt: zDateOptional,
});

export const metricLogParams = z.object({
  id: z.string().uuid({ message: ZodMessages.metricLog.invalidId }),
});

// Query for list logs (flat object; NOT wrapped in { query: ... })
export const listMetricLogsQuery = z.object({
  metricId: zUUID.optional(),
  startDate: zDateOptional,
  endDate: zDateOptional,
  sortBy: z.string().optional(), // keep flexible unless you want an enum
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// Note: query here if developed in the future

// export const createMetricLogSchema = z.object({
//   body: z.object({
//     metricId: zUUID,
//     type: zLogType.optional().default("manual"),
//     logValue: zPositiveFloat,
//     loggedAt: zDateOptional,
//   }),
// });

// export const updateMetricLogSchema = z.object({
//   params: z.object({
//     id: zUUID,
//   }),
//   body: z.object({
//     type: zLogType.optional(),
//     logValue: zPositiveFloat.optional(),
//     loggedAt: zDateOptional,
//   }),
// });

// export const getMetricLogSchema = z.object({
//   params: z.object({
//     id: zUUID,
//   }),
// });

// Query for aggregated stats
export const aggregatedStatsQuery = z.object({
  metricId: zUUID.optional(),
  startDate: zDateOptional,
  endDate: zDateOptional,
});

// export const deleteMetricLogSchema = z.object({
//   params: z.object({
//     id: zUUID,
//   }),
// });

// export const getAggregatedStatsSchema = z.object({
//   query: z.object({
//     metricId: zUUID.optional(),
//   }),
// });

// * Schema Implementations
export const createMetricLogSchema = { body: metricLogBody };
export const updateMetricLogSchema = {
  params: metricLogParams,
  body: metricLogBody.partial(),
};
export const getMetricLogByIdSchema = { params: metricLogParams };
export const getAllMetricLogsSchema = { query: listMetricLogsQuery };
export const deleteMetricLogSchema = { params: metricLogParams };
export const getAggregatedStatsSchema = { query: aggregatedStatsQuery };
/**
 * * ===== Schemas for Testing Purposes =====
 */

export const generateDummyMetricLogsBody = z.object({
  metricId: zUUID,
  count: z.coerce.number().int().min(1).max(1000).default(50),
});

export const generateDummyMetricLogsSchema = {
  body: generateDummyMetricLogsBody,
};
