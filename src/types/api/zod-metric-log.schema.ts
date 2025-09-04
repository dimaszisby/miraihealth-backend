import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  zDateOptional,
  zLogType,
  zPositiveFloat,
  zUUID,
  zISODateTime,
} from "@/constants/zod/zod-rules";
import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages";

extendZodWithOpenApi(z);

const FilterSchema = z.object({
  // bracket form
  ["filter[logValue]"]: z.number().min(1).optional(),
  ["filter[metricId]"]: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    zUUID.optional()
  ),

  // nested form
  // Safeguard in case Express parses into an object
  filter: z
    .object({
      logValue: z.number().min(1).optional(),
      metricId: zUUID.optional(),
    })
    .partial()
    .optional(),
});

// * ===== Base =====
export const metricLogParams = z.object({
  id: z.string().uuid({ message: ZodMessages.metricLog.invalidId }),
});

export const metricLogBody = z.object({
  metricId: zUUID,
  type: zLogType.optional().default("manual"),
  logValue: zPositiveFloat,
  loggedAt: zISODateTime.optional(),
});

// Query for list logs (flat object; NOT wrapped in { query: ... })
export const listMetricLogsQuery = z.object({
  metricId: zUUID.optional(),
  startDate: zISODateTime.optional(),
  endDate: zISODateTime.optional(),
  sortBy: z.string().optional(), // keep flexible unless you want an enum
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

// list query (offset for now; add cursor when ready)
export const listMetricsQuery = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(["createdAt", "updatedAt", "logValue"]).default("createdAt"),
  sortOrder: z.enum(["ASC", "DESC"]).default("DESC"),
});

export const listMetricQueryViaCursor = z
  .object({
    limit: z.coerce.number().int().min(1).max(100).default(20),
    sort: z
      .enum([
        "createdAt",
        "-createdAt",
        "updatedAt",
        "-updatedAt",
        "logValue",
        "-logValue",
        "loggedAt",
        "-loggedAt",
      ] as const)
      .default("-createdAt"),
    q: z.preprocess(
      (v) => (typeof v === "string" ? v.trim() : v),
      z.string().min(1).optional()
    ),
    after: z.string().optional(),
    includeTotal: z.coerce.boolean().default(false),
  })
  .and(FilterSchema)
  .transform((v) => {
    // Canonical filter object
    const logValue = v["filter[logValue]"] ?? v.filter?.logValue;
    const metricId = v["filter[metricId]"] ?? v.filter?.metricId;

    const filter: { logValue?: number; metricId?: string } = {};
    if (logValue) filter.logValue = logValue;
    if (metricId) filter.metricId = metricId;

    return {
      limit: v.limit,
      sort: v.sort,
      q: v.q,
      after: v.after,
      includeTotal: v.includeTotal,
      filter: Object.keys(filter).length ? filter : undefined,
    };
  });

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
  params: z.object({ id: z.string().uuid() }),
  body: metricLogBody.partial().extend({
    // if provided, must be ISO string
    loggedAt: zISODateTime.optional(),
  }),
};

export const getMetricLogByIdSchema = {
  params: metricLogParams,
  query: z.object({
    metricId: zUUID.optional(),
  }),
};
export const getAllMetricLogsSchema = { query: listMetricLogsQuery };
export const listMetricLogsViaCursorSchema = {
  query: listMetricQueryViaCursor,
};
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
