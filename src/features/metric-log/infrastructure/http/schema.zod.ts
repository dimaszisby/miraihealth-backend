import { extendZodWithOpenApi } from "@asteasolutions/zod-to-openapi";
import {
  zDateOptional,
  zLogType,
  zPositiveFloat,
  zUUID,
  zISODateTime,
} from "@/constants/zod/zod-rules.js";
import { z } from "zod";
import { ZodMessages } from "@/constants/zod/zod-messages.js";

extendZodWithOpenApi(z);

const FilterSchema = z.object({
  ["filter[logValue]"]: z.number().min(1).optional(),
  ["filter[metricId]"]: z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? undefined : v),
    zUUID.optional()
  ),
  filter: z
    .object({
      logValue: z.number().min(1).optional(),
      metricId: zUUID.optional(),
    })
    .partial()
    .optional(),
});

export const metricLogParams = z.object({
  id: z.string().uuid({ message: ZodMessages.metricLog.invalidId }),
});

export const metricLogBody = z.object({
  metricId: zUUID,
  type: zLogType.optional().default("manual"),
  logValue: zPositiveFloat,
  loggedAt: zISODateTime.optional(),
});

export const listMetricLogsQuery = z.object({
  metricId: zUUID.optional(),
  startDate: zISODateTime.optional(),
  endDate: zISODateTime.optional(),
  sortBy: z.string().optional(),
  order: z.enum(["asc", "desc"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(10),
});

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

export const aggregatedStatsQuery = z.object({
  metricId: zUUID.optional(),
  startDate: zDateOptional,
  endDate: zDateOptional,
});

export const createMetricLogSchema = z.object({ body: metricLogBody });
export const updateMetricLogSchema = z.object({
  params: z.object({ id: z.string().uuid() }),
  body: metricLogBody.partial().extend({
    loggedAt: zISODateTime.optional(),
  }),
});

export const getMetricLogByIdSchema = z.object({
  params: metricLogParams,
  query: z.object({
    metricId: zUUID,
  }),
});

export const getAllMetricLogsSchema = z.object({ query: listMetricLogsQuery });
export const listMetricLogsViaCursorSchema = z.object({
  query: listMetricQueryViaCursor,
});
export const deleteMetricLogSchema = z.object({ params: metricLogParams });
export const getAggregatedStatsSchema = z.object({ query: aggregatedStatsQuery });

export const generateDummyMetricLogsBody = z.object({
  metricId: zUUID,
  count: z.coerce.number().int().min(1).max(1000).default(50),
});

export const generateDummyMetricLogsSchema = z.object({
  body: generateDummyMetricLogsBody,
});
