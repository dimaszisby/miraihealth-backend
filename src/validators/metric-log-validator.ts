//src/validators/metric-log-validator.ts
import { z } from "zod";

/**
 * * Metric Log Schema Validator
 * Defines validation schemas for metric log-related requests.
 */

// Helper to preprocess date fields
const preprocessDate = (arg: unknown) =>
  typeof arg === "string" || arg instanceof Date ? new Date(arg) : arg;

// ✅ CREATE MetricLog Schema
export const createMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
  body: z.object({
    logValue: z
      .number()
      .nonnegative({ message: "logValue must be non-negative" }),
    type: z.enum(["manual", "automatic"]).optional().default("manual"),
    loggedAt: z
      .preprocess(
        preprocessDate,
        z.date({ required_error: "Invalid date format" })
      )
      .optional(),
  }),
});

// ✅ UPDATE MetricLog Schema
export const updateMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
  body: z.object({
    logValue: z
      .number()
      .nonnegative({ message: "logValue must be non-negative" })
      .optional(),
    type: z.enum(["manual", "automatic"]).optional().default("manual"),
    loggedAt: z
      .preprocess(
        preprocessDate,
        z.date({ required_error: "Invalid date format" })
      )
      .optional(),
  }),
});

// ✅ GET All MetricLogs Schema
export const getAllMetricLogsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
});

// ✅ GET MetricLog Schema
export const getMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
});

// ✅ DELETE MetricLog Schema
export const deleteMetricLogSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
    id: z.string().uuid({ message: "Invalid metric log ID" }),
  }),
});

// ✅ GET Aggregated Stats Schema
export const getAggregatedStatsSchema = z.object({
  params: z.object({
    metricId: z.string().uuid({ message: "Invalid metric ID" }),
  }),
});
